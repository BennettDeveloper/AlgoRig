package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.parser.ActionBlock;
import com.algorig.algorig_backend.parser.CodeBlock;
import com.algorig.algorig_backend.parser.ParsedScript;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BattleEngine {

    public static final int MAX_TURNS = 200;

    private final ActionExecutor actionExecutor;
    private final ConditionEvaluator conditionEvaluator;

    public BattleState simulate(
            Robot robotA, ParsedScript scriptA,
            Robot robotB, ParsedScript scriptB
    ) {
        ExecutionFrame frameA = buildFrame(robotA, scriptA);
        ExecutionFrame frameB = buildFrame(robotB, scriptB);

        BattleState state = BattleState.builder()
                .frameA(frameA)
                .frameB(frameB)
                .currentTurn(0)
                .log(new ArrayList<>())
                .winnerId(null)
                .build();

        while (state.getCurrentTurn() < MAX_TURNS && state.getWinnerId() == null) {
            state.setCurrentTurn(state.getCurrentTurn() + 1);
            int turn = state.getCurrentTurn();

            // Higher clockSpeed acts first; ties go to A
            boolean aFirst = robotA.getClockSpeed() >= robotB.getClockSpeed();
            ExecutionFrame first  = aFirst ? frameA : frameB;
            ExecutionFrame second = aFirst ? frameB : frameA;
            String firstActor  = aFirst ? "A" : "B";
            String secondActor = aFirst ? "B" : "A";

            // First actor
            BattleContext ctxFirst = buildContext(first, second, turn);
            Action intentFirst = resolveNextAction(first, ctxFirst);
            ActionResult resultFirst = actionExecutor.execute(intentFirst, first, second);
            state.getLog().add(buildLogEntry(turn, firstActor, resultFirst, first, second));

            if (second.getState().getHp() <= 0) {
                state.setWinnerId(firstActor);
                break;
            }

            // Second actor
            BattleContext ctxSecond = buildContext(second, first, turn);
            Action intentSecond = resolveNextAction(second, ctxSecond);
            ActionResult resultSecond = actionExecutor.execute(intentSecond, second, first);
            state.getLog().add(buildLogEntry(turn, secondActor, resultSecond, second, first));

            if (first.getState().getHp() <= 0) {
                state.setWinnerId(secondActor);
            }
        }

        // Determine winner by HP if max turns reached
        if (state.getWinnerId() == null) {
            int hpA = frameA.getState().getHp();
            int hpB = frameB.getState().getHp();
            if (hpA > hpB)      state.setWinnerId("A");
            else if (hpB > hpA) state.setWinnerId("B");
            else                 state.setWinnerId("DRAW");
        }

        return state;
    }

    // -------------------------------------------------------------------------
    // Pointer resolution
    // -------------------------------------------------------------------------

    /**
     * Advances the program pointer for the given frame and returns the next Action to execute.
     * CodeBlock conditions are evaluated once on entry; CPU_STALL is returned when an IF
     * has no ELSE and the condition is false.
     */
    Action resolveNextAction(ExecutionFrame frame, BattleContext context) {
        List<Object> topLevel = frame.getParsedScript().getBlocks();

        while (true) {
            if (frame.getBranchStack().isEmpty()) {
                // At top level — wrap-around (script loop)
                if (frame.getPointerIndex() >= topLevel.size()) {
                    frame.setPointerIndex(0);
                }
                Object block = topLevel.get(frame.getPointerIndex());
                frame.setPointerIndex(frame.getPointerIndex() + 1);

                if (block instanceof ActionBlock ab) {
                    return ab.getAction();
                } else if (block instanceof CodeBlock cb) {
                    int blockIdx = frame.getPointerIndex() - 1;
                    boolean condResult = conditionEvaluator.evaluate(cb.getCondition(), context);
                    if (condResult) {
                        frame.getBranchStack().push(new int[]{blockIdx, 0, 0});
                    } else if (!cb.getElseBranch().isEmpty()) {
                        frame.getBranchStack().push(new int[]{blockIdx, 1, 0});
                    } else {
                        return Action.CPU_STALL;
                    }
                    // continue — next iteration peeks into the branch
                }
            } else {
                // Inside a branch
                List<Object> branch = getActiveBranchList(frame, topLevel);
                int[] top = frame.getBranchStack().peek();
                int pos = top[2];

                if (pos >= branch.size()) {
                    // Branch exhausted — pop and continue up the stack
                    frame.getBranchStack().pop();
                } else {
                    top[2]++; // advance position within branch
                    Object block = branch.get(pos);

                    if (block instanceof ActionBlock ab) {
                        return ab.getAction();
                    } else if (block instanceof CodeBlock cb) {
                        boolean condResult = conditionEvaluator.evaluate(cb.getCondition(), context);
                        // blockIndex here is the position within the parent branch
                        if (condResult) {
                            frame.getBranchStack().push(new int[]{pos, 0, 0});
                        } else if (!cb.getElseBranch().isEmpty()) {
                            frame.getBranchStack().push(new int[]{pos, 1, 0});
                        } else {
                            return Action.CPU_STALL;
                        }
                        // continue — next iteration peeks into the nested branch
                    }
                }
            }
        }
    }

    /**
     * Returns the branch list currently being iterated by the top of the branchStack.
     * Navigates from the bottom (oldest) stack entry — which indexes into top-level blocks —
     * up through nested branches to resolve the CodeBlock for the top entry.
     *
     * ArrayDeque.toArray() returns elements from head (top/newest) to tail (bottom/oldest),
     * so entries[0] is the most recently pushed frame and entries[n-1] is the oldest.
     */
    private List<Object> getActiveBranchList(ExecutionFrame frame, List<Object> topLevel) {
        int[][] entries = frame.getBranchStack().toArray(new int[0][]);
        int n = entries.length;

        // Start from the bottom entry which always indexes into topLevel
        List<Object> currentParent = topLevel;
        CodeBlock current = (CodeBlock) currentParent.get(entries[n - 1][0]);

        // Walk inward: each level's branchType tells us which branch list to descend into
        for (int i = n - 2; i >= 0; i--) {
            // The branch list that contains the CodeBlock for entries[i]
            List<Object> parentBranch = entries[i + 1][1] == 0
                    ? current.getIfBranch()
                    : current.getElseBranch();
            current = (CodeBlock) parentBranch.get(entries[i][0]);
        }

        // The top entry's branchType selects which branch we're iterating
        int[] top = entries[0];
        return top[1] == 0 ? current.getIfBranch() : current.getElseBranch();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ExecutionFrame buildFrame(Robot robot, ParsedScript script) {
        RobotBattleState state = RobotBattleState.builder()
                .hp(robot.getSystemIntegrity())
                .battery(robot.getBattery())
                .armor(robot.getChassisArmor())
                .firewall(robot.getFirewallStrength())
                .heat(0)
                .lastAction(null)
                .build();

        return ExecutionFrame.builder()
                .robot(robot)
                .state(state)
                .parsedScript(script)
                .pointerIndex(0)
                .branchStack(new ArrayDeque<>())
                .inBranch(false)
                .build();
    }

    private BattleContext buildContext(ExecutionFrame myFrame, ExecutionFrame enemyFrame, int turn) {
        return BattleContext.builder()
                .myState(myFrame.getState())
                .enemyState(enemyFrame.getState())
                .turnNumber(turn)
                .build();
    }

    private BattleLogEntry buildLogEntry(int turn, String actor, ActionResult result,
                                          ExecutionFrame attacker, ExecutionFrame defender) {
        return BattleLogEntry.builder()
                .turn(turn)
                .actor(actor)
                .actionTaken(result.getActionTaken())
                .stalledDueToInsufficientBattery(result.isStalledDueToInsufficientBattery())
                .damageDealt(result.getDamageDealt())
                .healingDone(result.getHealingDone())
                .batterySpent(result.getBatterySpent())
                .attackerHpAfter(attacker.getState().getHp())
                .defenderHpAfter(defender.getState().getHp())
                .attackerBatteryAfter(attacker.getState().getBattery())
                .description(result.getDescription())
                .build();
    }
}
