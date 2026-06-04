package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.parser.ActionBlock;
import com.algorig.algorig_backend.parser.CodeBlock;
import com.algorig.algorig_backend.parser.ParsedScript;
import com.algorig.algorig_backend.parser.RepeatMarkerBlock;
import com.algorig.algorig_backend.parser.SetBlock;
import com.algorig.algorig_backend.parser.UpdateBlock;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BattleEngine {

    public static final int DEFAULT_MAX_TURNS = 200;
    private static final int MAX_BLOCK_EVALS_PER_TURN = 200;

    private final ActionExecutor actionExecutor;
    private final ConditionEvaluator conditionEvaluator;
    private final NarrativeEngine narrativeEngine;
    private final ExpressionEvaluator expressionEvaluator;
    private final PassiveExecutor passiveExecutor;

    public BattleState simulate(
            Robot robotA, ParsedScript scriptA,
            Robot robotB, ParsedScript scriptB,
            int maxTurns
    ) {
        ExecutionFrame frameA = buildFrame(robotA, scriptA);
        ExecutionFrame frameB = buildFrame(robotB, scriptB);
        passiveExecutor.initBattleState(frameA);
        passiveExecutor.initBattleState(frameB);

        BattleState state = BattleState.builder()
                .frameA(frameA)
                .frameB(frameB)
                .currentTurn(0)
                .log(new ArrayList<>())
                .winnerId(null)
                .build();

        String nameA = robotA.getName();
        String nameB = robotB.getName();

        while (state.getCurrentTurn() < maxTurns && state.getWinnerId() == null) {
            state.setCurrentTurn(state.getCurrentTurn() + 1);
            int turn = state.getCurrentTurn();

            boolean aFirst = robotA.getClockSpeed() >= robotB.getClockSpeed();
            ExecutionFrame first  = aFirst ? frameA : frameB;
            ExecutionFrame second = aFirst ? frameB : frameA;
            String firstActor  = aFirst ? "A" : "B";
            String secondActor = aFirst ? "B" : "A";
            String firstName   = aFirst ? nameA : nameB;
            String secondName  = aFirst ? nameB : nameA;

            // First actor
            passiveExecutor.resetTurnState(first);
            if (first.getState().isScanning()) {
                handleScanTick(first, firstActor, firstName, turn, second, state.getLog());
            } else {
                BattleContext ctxFirst = buildContext(first, second, turn);
                Action actionFirst = resolveNextAction(first, ctxFirst, firstActor, turn, first, second, state.getLog());
                state.getLog().addAll(passiveExecutor.applyPreAction(first, second, actionFirst, turn, firstActor));
                ActionResult resultFirst = actionExecutor.execute(actionFirst, first, second);
                List<BattleLogEntry> firstPostPassives = passiveExecutor.applyPostAction(first, second, actionFirst, resultFirst, turn, firstActor);
                resultFirst.setDescription(narrativeEngine.narrateAction(actionFirst, firstName, secondName, resultFirst, false));
                state.getLog().add(buildActionLogEntry(firstActor, turn, actionFirst, resultFirst, first, second));
                state.getLog().addAll(firstPostPassives);
            }

            if (second.getState().getHp() <= 0) {
                state.setWinnerId(firstActor);
                break;
            }

            // Second actor
            passiveExecutor.resetTurnState(second);
            if (second.getState().isScanning()) {
                handleScanTick(second, secondActor, secondName, turn, first, state.getLog());
            } else {
                BattleContext ctxSecond = buildContext(second, first, turn);
                Action actionSecond = resolveNextAction(second, ctxSecond, secondActor, turn, second, first, state.getLog());
                state.getLog().addAll(passiveExecutor.applyPreAction(second, first, actionSecond, turn, secondActor));
                ActionResult resultSecond = actionExecutor.execute(actionSecond, second, first);
                List<BattleLogEntry> secondPostPassives = passiveExecutor.applyPostAction(second, first, actionSecond, resultSecond, turn, secondActor);
                resultSecond.setDescription(narrativeEngine.narrateAction(actionSecond, secondName, firstName, resultSecond, false));
                state.getLog().add(buildActionLogEntry(secondActor, turn, actionSecond, resultSecond, second, first));
                state.getLog().addAll(secondPostPassives);
            }

            if (first.getState().getHp() <= 0) {
                state.setWinnerId(secondActor);
                break;
            }

            if (state.getWinnerId() != null) break;

            if (processBatteryDrain(first, firstActor, firstName, secondName, turn, second, state)) break;
            if (processBatteryDrain(second, secondActor, secondName, firstName, turn, first, state)) break;
        }

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

    Action resolveNextAction(ExecutionFrame frame, BattleContext context,
                             String actor, int turn,
                             ExecutionFrame attackerFrame, ExecutionFrame defenderFrame,
                             List<BattleLogEntry> log) {
        List<Object> topLevel = frame.getParsedScript().getBlocks();
        int evalCount = 0;

        while (true) {
            if (++evalCount > MAX_BLOCK_EVALS_PER_TURN) {
                return Action.CPU_STALL;
            }
            if (frame.getBranchStack().isEmpty()) {
                // At top level — wrap-around
                if (frame.getPointerIndex() >= topLevel.size()) {
                    frame.setPointerIndex(0);
                }
                Object block = topLevel.get(frame.getPointerIndex());
                frame.setPointerIndex(frame.getPointerIndex() + 1);

                if (block instanceof ActionBlock ab) {
                    return ab.getAction();

                } else if (block instanceof CodeBlock cb) {
                    int blockIdx = frame.getPointerIndex() - 1;
                    boolean condResult = conditionEvaluator.evaluate(cb.getCondition(), context, frame.getMemory());
                    boolean hasElse = !cb.getElseIfChains().isEmpty() || !cb.getElseBranch().isEmpty();
                    log.add(buildConditionEntry(actor, turn, cb.getCondition(), condResult, hasElse, attackerFrame, defenderFrame));
                    if (condResult) {
                        frame.getBranchStack().push(new int[]{blockIdx, 0, 0});
                    } else {
                        int matched = resolveElseIfChain(cb, frame, context, actor, turn, attackerFrame, defenderFrame, log);
                        if (matched >= 0) {
                            frame.getBranchStack().push(new int[]{blockIdx, 2 + matched, 0});
                        } else if (!cb.getElseBranch().isEmpty()) {
                            frame.getBranchStack().push(new int[]{blockIdx, 1, 0});
                        }
                        // else: no matching branch — skip to next block, no turn consumed
                    }

                } else if (block instanceof RepeatMarkerBlock rmb) {
                    log.add(buildRepeatMarkerEntry(actor, turn, rmb, attackerFrame, defenderFrame));
                    // continue — marker does not consume a turn

                } else if (block instanceof SetBlock sb) {
                    processSetBlock(sb, actor, turn, frame, context, attackerFrame, defenderFrame, log);
                    // continue — SET does not consume a turn

                } else if (block instanceof UpdateBlock ub) {
                    processUpdateBlock(ub, actor, turn, frame, context, attackerFrame, defenderFrame, log);
                    // continue — UPDATE does not consume a turn
                }

            } else {
                // Inside a branch
                List<Object> branch = getActiveBranchList(frame, topLevel);
                int[] top = frame.getBranchStack().peek();
                int pos = top[2];

                if (pos >= branch.size()) {
                    frame.getBranchStack().pop();
                } else {
                    top[2]++;
                    Object block = branch.get(pos);

                    if (block instanceof ActionBlock ab) {
                        return ab.getAction();

                    } else if (block instanceof CodeBlock cb) {
                        boolean condResult = conditionEvaluator.evaluate(cb.getCondition(), context, frame.getMemory());
                        boolean hasElse = !cb.getElseIfChains().isEmpty() || !cb.getElseBranch().isEmpty();
                        log.add(buildConditionEntry(actor, turn, cb.getCondition(), condResult, hasElse, attackerFrame, defenderFrame));
                        if (condResult) {
                            frame.getBranchStack().push(new int[]{pos, 0, 0});
                        } else {
                            int matched = resolveElseIfChain(cb, frame, context, actor, turn, attackerFrame, defenderFrame, log);
                            if (matched >= 0) {
                                frame.getBranchStack().push(new int[]{pos, 2 + matched, 0});
                            } else if (!cb.getElseBranch().isEmpty()) {
                                frame.getBranchStack().push(new int[]{pos, 1, 0});
                            }
                            // else: no matching branch — skip to next item in branch, no turn consumed
                        }

                    } else if (block instanceof RepeatMarkerBlock rmb) {
                        log.add(buildRepeatMarkerEntry(actor, turn, rmb, attackerFrame, defenderFrame));
                        // continue

                    } else if (block instanceof SetBlock sb) {
                        processSetBlock(sb, actor, turn, frame, context, attackerFrame, defenderFrame, log);
                        // continue

                    } else if (block instanceof UpdateBlock ub) {
                        processUpdateBlock(ub, actor, turn, frame, context, attackerFrame, defenderFrame, log);
                        // continue
                    }
                }
            }
        }
    }

    private void processUpdateBlock(UpdateBlock ub, String actor, int turn, ExecutionFrame frame,
                                     BattleContext context,
                                     ExecutionFrame attackerFrame, ExecutionFrame defenderFrame,
                                     List<BattleLogEntry> log) {
        int oldValue = frame.getMemory().get(ub.getVariableName());
        int rhsValue = expressionEvaluator.evaluate(ub.getExpression(), context, frame.getMemory());
        int newValue = switch (ub.getOperator()) {
            case "+=" -> oldValue + rhsValue;
            case "-=" -> oldValue - rhsValue;
            case "*=" -> oldValue * rhsValue;
            case "/=" -> rhsValue != 0 ? oldValue / rhsValue : 0;
            case "%=" -> rhsValue != 0 ? oldValue % rhsValue : 0;
            default   -> oldValue;
        };
        frame.getMemory().set(ub.getVariableName(), newValue);

        log.add(BattleLogEntry.builder()
                .turn(turn)
                .actor(actor)
                .entryType("MEMORY_UPDATE")
                .memoryVarName(ub.getVariableName())
                .memoryVarOldValue(oldValue)
                .memoryVarNewValue(newValue)
                .attackerHpAfter(attackerFrame.getState().getHp())
                .defenderHpAfter(defenderFrame.getState().getHp())
                .attackerBatteryAfter(attackerFrame.getState().getBattery())
                .description(narrativeEngine.narrateMemoryUpdate(
                        attackerFrame.getRobot().getName(),
                        ub.getVariableName(),
                        ub.getOperator(),
                        oldValue, rhsValue, newValue))
                .build());
    }

    private void processSetBlock(SetBlock sb, String actor, int turn, ExecutionFrame frame,
                                  BattleContext context,
                                  ExecutionFrame attackerFrame, ExecutionFrame defenderFrame,
                                  List<BattleLogEntry> log) {
        int oldValue = frame.getMemory().get(sb.getVariableName());
        int newValue = expressionEvaluator.evaluate(sb.getExpression(), context, frame.getMemory());
        frame.getMemory().set(sb.getVariableName(), newValue);

        log.add(BattleLogEntry.builder()
                .turn(turn)
                .actor(actor)
                .entryType("MEMORY_SET")
                .memoryVarName(sb.getVariableName())
                .memoryVarOldValue(oldValue)
                .memoryVarNewValue(newValue)
                .attackerHpAfter(attackerFrame.getState().getHp())
                .defenderHpAfter(defenderFrame.getState().getHp())
                .attackerBatteryAfter(attackerFrame.getState().getBattery())
                .description(narrativeEngine.narrateMemorySet(
                        attackerFrame.getRobot().getName(),
                        sb.getVariableName(), oldValue, newValue))
                .build());
    }

    private BattleLogEntry buildRepeatMarkerEntry(String actor, int turn, RepeatMarkerBlock rmb,
                                                   ExecutionFrame attackerFrame, ExecutionFrame defenderFrame) {
        String entryType = "REPEAT_" + rmb.getMarkerType();
        String description = switch (rmb.getMarkerType()) {
            case "START" -> narrativeEngine.narrateRepeatStart(attackerFrame.getRobot().getName(), rmb.getTotal());
            case "LOOP"  -> narrativeEngine.narrateRepeatLoop(attackerFrame.getRobot().getName(), rmb.getIteration(), rmb.getTotal());
            default      -> narrativeEngine.narrateRepeatEnd(attackerFrame.getRobot().getName(), rmb.getTotal());
        };
        return BattleLogEntry.builder()
                .turn(turn)
                .actor(actor)
                .entryType(entryType)
                .repeatIteration(rmb.getIteration())
                .repeatTotal(rmb.getTotal())
                .attackerHpAfter(attackerFrame.getState().getHp())
                .defenderHpAfter(defenderFrame.getState().getHp())
                .attackerBatteryAfter(attackerFrame.getState().getBattery())
                .description(description)
                .build();
    }

    /**
     * Evaluates each ELSE IF chain in order and returns the 0-based index of the first
     * matching chain, or -1 if none match.
     */
    private int resolveElseIfChain(CodeBlock cb, ExecutionFrame frame, BattleContext context,
                                   String actor, int turn,
                                   ExecutionFrame attackerFrame, ExecutionFrame defenderFrame,
                                   List<BattleLogEntry> log) {
        List<CodeBlock.ElseIfChain> chains = cb.getElseIfChains();
        for (int i = 0; i < chains.size(); i++) {
            boolean chainHasMore = (i < chains.size() - 1) || !cb.getElseBranch().isEmpty();
            boolean chainResult = conditionEvaluator.evaluate(chains.get(i).getCondition(), context, frame.getMemory());
            log.add(buildConditionEntry(actor, turn, chains.get(i).getCondition(), chainResult, chainHasMore, attackerFrame, defenderFrame));
            if (chainResult) return i;
        }
        return -1;
    }

    /** Maps a branchType integer to the corresponding branch list on a CodeBlock.
     *  0 = ifBranch, 1 = elseBranch, n>=2 = elseIfChains[n-2].children */
    private List<Object> getBranchByType(CodeBlock cb, int branchType) {
        if (branchType == 0) return cb.getIfBranch();
        if (branchType == 1) return cb.getElseBranch();
        return cb.getElseIfChains().get(branchType - 2).getChildren();
    }

    /**
     * Returns the branch list currently being iterated by the top of the branchStack.
     * Only CodeBlocks are ever pushed onto the branchStack, so the cast is safe.
     */
    private List<Object> getActiveBranchList(ExecutionFrame frame, List<Object> topLevel) {
        int[][] entries = frame.getBranchStack().toArray(new int[0][]);
        int n = entries.length;

        List<Object> currentParent = topLevel;
        CodeBlock current = (CodeBlock) currentParent.get(entries[n - 1][0]);

        for (int i = n - 2; i >= 0; i--) {
            List<Object> parentBranch = getBranchByType(current, entries[i + 1][1]);
            current = (CodeBlock) parentBranch.get(entries[i][0]);
        }

        return getBranchByType(current, entries[0][1]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void handleScanTick(
            ExecutionFrame frame,
            String actor,
            String attackerName,
            int turn,
            ExecutionFrame defenderFrame,
            List<BattleLogEntry> log
    ) {
        RobotBattleState state = frame.getState();
        state.setScanTurnsRemaining(state.getScanTurnsRemaining() - 1);

        if (state.getScanTurnsRemaining() <= 0) {
            state.setScanning(false);
            Robot base = frame.getRobot();
            List<String> restored = new ArrayList<>();

            if (state.getFirewall() < base.getFirewallStrength()) {
                restored.add("Firewall " + state.getFirewall() + " → " + base.getFirewallStrength());
                state.setFirewall(base.getFirewallStrength());
            }
            if (state.getArmor() < base.getChassisArmor()) {
                restored.add("Armor " + state.getArmor() + " → " + base.getChassisArmor());
                state.setArmor(base.getChassisArmor());
            }
            if (state.getStability() < base.getStability()) {
                restored.add("Stability " + state.getStability() + " → " + base.getStability());
                state.setStability(base.getStability());
            }

            log.add(BattleLogEntry.builder()
                    .turn(turn)
                    .actor(actor)
                    .entryType("SCAN_COMPLETE")
                    .actionTaken(Action.SYSTEM_SCAN)
                    .debuffsRemoved(restored)
                    .scanTurnsRemaining(0)
                    .attackerHpAfter(state.getHp())
                    .defenderHpAfter(defenderFrame.getState().getHp())
                    .attackerBatteryAfter(state.getBattery())
                    .description(narrativeEngine.narrateScanComplete(attackerName, restored))
                    .build());
        } else {
            log.add(BattleLogEntry.builder()
                    .turn(turn)
                    .actor(actor)
                    .entryType("SCAN_TICK")
                    .actionTaken(Action.SYSTEM_SCAN)
                    .scanTurnsRemaining(state.getScanTurnsRemaining())
                    .attackerHpAfter(state.getHp())
                    .defenderHpAfter(defenderFrame.getState().getHp())
                    .attackerBatteryAfter(state.getBattery())
                    .description(narrativeEngine.narrateScanTick(
                            attackerName,
                            state.getScanTurnsRemaining(),
                            state.getScanTurnsTotal()
                    ))
                    .build());
        }
    }

    private ExecutionFrame buildFrame(Robot robot, ParsedScript script) {
        RobotBattleState state = RobotBattleState.builder()
                .hp(robot.getSystemIntegrity())
                .battery(robot.getBattery())
                .armor(robot.getChassisArmor())
                .firewall(robot.getFirewallStrength())
                .stability(robot.getStability())
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

    private BattleLogEntry buildActionLogEntry(String actor, int turn, Action action,
                                                ActionResult result,
                                                ExecutionFrame attackerFrame,
                                                ExecutionFrame defenderFrame) {
        return BattleLogEntry.builder()
                .turn(turn)
                .actor(actor)
                .entryType("ACTION")
                .actionTaken(result.getActionTaken())
                .stalledDueToInsufficientBattery(result.isStalledDueToInsufficientBattery())
                .stalledDueToOverload(result.isStalledDueToOverload())
                .damageDealt(result.getDamageDealt())
                .healingDone(result.getHealingDone())
                .batterySpent(result.getBatterySpent())
                .batteryEqualized(result.getBatteryEqualized())
                .scanTurnsRemaining(result.getScanDuration())
                .attackerHpAfter(attackerFrame.getState().getHp())
                .defenderHpAfter(defenderFrame.getState().getHp())
                .attackerBatteryAfter(attackerFrame.getState().getBattery())
                .defenderBatteryAfter(defenderFrame.getState().getBattery())
                .description(result.getDescription())
                .build();
    }

    private int calculatePassiveDrain(Robot robot) {
        return Math.max(1, 10 - (robot.getBattery() / 15));
    }

    private boolean processBatteryDrain(ExecutionFrame frame, String actor, String robotName,
                                         String enemyName, int turn,
                                         ExecutionFrame defenderFrame, BattleState battleState) {
        RobotBattleState s = frame.getState();
        int drain = calculatePassiveDrain(frame.getRobot());
        int newBattery = s.getBattery() - drain;
        s.setBattery(newBattery);

        if (newBattery <= 0) {
            s.setBattery(0);
            String winnerActor = "A".equals(actor) ? "B" : "A";
            battleState.setWinnerId(winnerActor);
            battleState.getLog().add(BattleLogEntry.builder()
                    .turn(turn)
                    .actor(actor)
                    .entryType("BATTERY_DRAIN")
                    .actionTaken(Action.CPU_STALL)
                    .damageDealt(0)
                    .healingDone(0)
                    .batterySpent(drain)
                    .attackerHpAfter(s.getHp())
                    .defenderHpAfter(defenderFrame.getState().getHp())
                    .attackerBatteryAfter(0)
                    .description(narrativeEngine.narrateBatteryDepleted(robotName, enemyName))
                    .build());
            return true;
        }

        battleState.getLog().add(BattleLogEntry.builder()
                .turn(turn)
                .actor(actor)
                .entryType("BATTERY_DRAIN")
                .actionTaken(Action.CPU_STALL)
                .damageDealt(0)
                .healingDone(0)
                .batterySpent(drain)
                .attackerHpAfter(s.getHp())
                .defenderHpAfter(defenderFrame.getState().getHp())
                .attackerBatteryAfter(newBattery)
                .description(narrativeEngine.narrateBatteryDrain(robotName, drain, newBattery))
                .build());
        return false;
    }

    private BattleLogEntry buildConditionEntry(String actor, int turn, String condition,
                                                boolean result, boolean hasElse,
                                                ExecutionFrame attackerFrame,
                                                ExecutionFrame defenderFrame) {
        return BattleLogEntry.builder()
                .turn(turn)
                .actor(actor)
                .entryType("CONDITION_CHECK")
                .conditionChecked(condition)
                .conditionResult(result)
                .hasElseBranch(hasElse)
                .stalledDueToInsufficientBattery(false)
                .damageDealt(0)
                .healingDone(0)
                .batterySpent(0)
                .attackerHpAfter(attackerFrame.getState().getHp())
                .defenderHpAfter(defenderFrame.getState().getHp())
                .attackerBatteryAfter(attackerFrame.getState().getBattery())
                .description(narrativeEngine.narrateConditionCheck(
                        attackerFrame.getRobot().getName(), condition, result, hasElse))
                .build();
    }
}
