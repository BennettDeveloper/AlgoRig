package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.parser.ParsedScript;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayDeque;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for PassiveExecutor.
 *
 * PassiveExecutor is a Spring @Component that exposes instance methods —
 * it has no injected dependencies so it can be instantiated directly.
 * Passive state lives in frame.getState().getPassiveState() (RobotBattleState),
 * not in frame.getPassiveState() (ExecutionFrame).
 * Passive lookup uses robot.getName() → RobotPassive.byRobotName().
 */
class PassiveExecutorTest {

    private PassiveExecutor passiveExecutor;

    @BeforeEach
    void setUp() {
        passiveExecutor = new PassiveExecutor();
    }

    // =========================================================================
    // QUICK_REFLEXES ("BoltJr") — +10% wattage battery regen after each action
    // =========================================================================

    @Test
    void quickReflexes_addsWattageBonusToBattery() {
        ExecutionFrame attacker = buildFrame("BoltJr", 100, 50, 100, 30);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);
        ActionResult result = nonStallResult(Action.HARD_STRIKE, 10);

        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");

        // bonus = max(1, round(30 * 0.10)) = 3
        assertEquals(53, attacker.getState().getBattery());
    }

    @Test
    void quickReflexes_doesNotFireOnStall() {
        ExecutionFrame attacker = buildFrame("BoltJr", 100, 50, 100, 30);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);
        ActionResult stalledResult = ActionResult.builder()
                .actionTaken(Action.CPU_STALL)
                .stalledDueToInsufficientBattery(true)
                .batterySpent(0)
                .build();

        passiveExecutor.applyPostAction(attacker, defender, Action.CPU_STALL, stalledResult, 1, "A");

        // No regen on stall — battery unchanged
        assertEquals(50, attacker.getState().getBattery());
    }

    // =========================================================================
    // SELF_REPAIR ("NanoUnit") — +3 HP per turn (fires even on stall)
    // =========================================================================

    @Test
    void selfRepair_addsThreeHpPerTurn() {
        ExecutionFrame attacker = buildFrame("NanoUnit", 90, 100, 100, 0);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);
        ActionResult result = nonStallResult(Action.PATCH, 0);

        passiveExecutor.applyPostAction(attacker, defender, Action.PATCH, result, 1, "A");

        assertEquals(93, attacker.getState().getHp());
    }

    @Test
    void selfRepair_atFullHp_doesNotOverheal() {
        ExecutionFrame attacker = buildFrame("NanoUnit", 100, 100, 100, 0);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);
        ActionResult result = nonStallResult(Action.PATCH, 0);

        passiveExecutor.applyPostAction(attacker, defender, Action.PATCH, result, 1, "A");

        // HP cannot exceed systemIntegrity
        assertEquals(100, attacker.getState().getHp());
    }

    @Test
    void selfRepair_capsAtMaxHp_whenCloseToFull() {
        // 99 HP → 99+3=102, capped at 100
        ExecutionFrame attacker = buildFrame("NanoUnit", 99, 100, 100, 0);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);
        ActionResult result = nonStallResult(Action.HARD_STRIKE, 5);

        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");

        assertEquals(100, attacker.getState().getHp());
    }

    @Test
    void selfRepair_firesEvenWhenStalledOnBattery() {
        ExecutionFrame attacker = buildFrame("NanoUnit", 85, 0, 100, 0);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);
        // SELF_REPAIR fires before the stall-check guard, so it applies even on stall
        ActionResult stalledResult = ActionResult.builder()
                .actionTaken(Action.CPU_STALL)
                .stalledDueToInsufficientBattery(true)
                .batterySpent(0)
                .build();

        passiveExecutor.applyPostAction(attacker, defender, Action.CPU_STALL, stalledResult, 1, "A");

        assertEquals(88, attacker.getState().getHp());
    }

    // =========================================================================
    // RESILIENT_FRAME ("Sparky") — defender takes 5% less damage
    // =========================================================================

    @Test
    void resilientFrame_reducesDamageTakenByFivePercent() {
        ExecutionFrame attacker = buildFrame("Nobody", 100, 100, 100, 10);
        // Defender starts at 80 HP (already had 20 damage applied before passive runs)
        ExecutionFrame defender = buildFrame("Sparky", 80, 100, 100, 0);
        ActionResult result = nonStallResult(Action.HARD_STRIKE, 20);

        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");

        // reduction = max(1, round(20 * 0.05)) = max(1, 1) = 1
        assertEquals(81, defender.getState().getHp());
        assertEquals(19, result.getDamageDealt());
    }

    @Test
    void resilientFrame_minimumReductionIsOne() {
        ExecutionFrame attacker = buildFrame("Nobody", 100, 100, 100, 10);
        // Even 1 damage still gets 1 reduction (max(1, round(1*0.05))=max(1,0)=1)
        ExecutionFrame defender = buildFrame("Sparky", 99, 100, 100, 0);
        ActionResult result = nonStallResult(Action.HARD_STRIKE, 1);

        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");

        // reduction = max(1, 0) = 1 → HP restored by 1 (back to max), damage = 0
        assertEquals(100, defender.getState().getHp());
        assertEquals(0, result.getDamageDealt());
    }

    // =========================================================================
    // INFINITE_LOOP ("OmegaCore") — pre-action top-up + 50% wattage regen
    // =========================================================================

    @Test
    void infiniteLoop_topsUpBatteryToThirtyBeforeAction() {
        ExecutionFrame attacker = buildFrame("OmegaCore", 100, 15, 100, 20);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);

        List<BattleLogEntry> logs = passiveExecutor.applyPreAction(
                attacker, defender, Action.HARD_STRIKE, 1, "A");

        // Battery < 30 → topped up to 30
        assertEquals(30, attacker.getState().getBattery());
        assertFalse(logs.isEmpty(), "Expected emergency-power log entry");
    }

    @Test
    void infiniteLoop_doesNotTopUpWhenBatteryAlreadySufficient() {
        ExecutionFrame attacker = buildFrame("OmegaCore", 100, 50, 100, 20);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);

        passiveExecutor.applyPreAction(attacker, defender, Action.HARD_STRIKE, 1, "A");

        // Battery >= 30 → no top-up
        assertEquals(50, attacker.getState().getBattery());
    }

    @Test
    void infiniteLoop_postAction_regenFiftyPercentWattage() {
        ExecutionFrame attacker = buildFrame("OmegaCore", 100, 40, 100, 20);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);
        ActionResult result = nonStallResult(Action.HARD_STRIKE, 5);

        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");

        // bonus = max(1, round(20 * 0.50)) = 10
        assertEquals(50, attacker.getState().getBattery());
    }

    // =========================================================================
    // HYPERDRIVE ("HyperStrike") — stacking damage bonus, reset on hit taken
    // =========================================================================

    @Test
    void hyperDrive_stackIncrementsEachAction() {
        ExecutionFrame attacker = buildFrame("HyperStrike", 100, 100, 100, 0);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);
        ActionResult result = nonStallResult(Action.HARD_STRIKE, 20);

        // Turn 1: stack starts at 0 → becomes 1
        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");
        assertEquals(1, attacker.getState().getPassiveState().getInt("Hyperdrive:stack"));

        // Turn 2: stack 1 → becomes 2
        result.setDamageDealt(20);
        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 2, "A");
        assertEquals(2, attacker.getState().getPassiveState().getInt("Hyperdrive:stack"));
    }

    @Test
    void hyperDrive_capsAtTenStacks() {
        ExecutionFrame attacker = buildFrame("HyperStrike", 100, 100, 100, 0);
        ExecutionFrame defender = buildFrame("Nobody", 100, 10000, 10000, 0);

        for (int i = 0; i < 15; i++) {
            ActionResult result = nonStallResult(Action.HARD_STRIKE, 20);
            passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, i + 1, "A");
        }

        assertEquals(10, attacker.getState().getPassiveState().getInt("Hyperdrive:stack"),
                "Stack must never exceed 10");
    }

    @Test
    void hyperDrive_bonusDamageUsesCurrentStackAtTimeOfAttack() {
        // On turn 1: stack=0 → no bonus (stack is checked BEFORE incrementing for bonus)
        // On turn 2: stack=1 → bonus = round(20 * 1 * 0.05) = 1
        ExecutionFrame attacker = buildFrame("HyperStrike", 100, 100, 100, 0);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100, 100, 0);

        // Turn 1: stack was 0 → no bonus
        ActionResult result1 = nonStallResult(Action.HARD_STRIKE, 20);
        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result1, 1, "A");
        assertEquals(20, result1.getDamageDealt(), "No bonus on first turn (stack was 0)");

        // Turn 2: stack was 1 → bonus = max(1, round(20*1*0.05)) = max(1,1) = 1
        result1.setDamageDealt(20);
        ActionResult result2 = nonStallResult(Action.HARD_STRIKE, 20);
        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result2, 2, "A");
        assertEquals(21, result2.getDamageDealt(), "Expected +1 bonus damage at stack 1");
    }

    @Test
    void hyperDrive_bonusNeverExceedsFiftyPercent() {
        // At MAX_STACKS=10: bonus = round(damage * 10 * 0.05) = round(damage * 0.50)
        ExecutionFrame attacker = buildFrame("HyperStrike", 100, 100, 100, 0);
        ExecutionFrame defender = buildFrame("Nobody", 100, 100000, 100000, 0);

        // Get to max stacks
        for (int i = 0; i < 10; i++) {
            ActionResult result = nonStallResult(Action.HARD_STRIKE, 20);
            passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, i + 1, "A");
        }

        assertEquals(10, attacker.getState().getPassiveState().getInt("Hyperdrive:stack"));

        // At stack=10, bonus = round(20 * 10 * 0.05) = round(10) = 10 = 50% of 20
        ActionResult finalResult = nonStallResult(Action.HARD_STRIKE, 20);
        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, finalResult, 11, "A");
        int bonus = finalResult.getDamageDealt() - 20;
        assertTrue(bonus <= 10, "Bonus at max stacks must be ≤50% of base damage; got " + bonus);
        assertTrue(bonus >= 1, "Bonus must be at least 1");
    }

    @Test
    void hyperDrive_resetsToZeroWhenDamageTaken() {
        // Set up HyperStrike as the DEFENDER with existing stacks
        ExecutionFrame attacker = buildFrame("Nobody", 100, 100, 100, 10);
        ExecutionFrame defender = buildFrame("HyperStrike", 80, 100, 100, 0);
        // Pre-load stacks on the defender's passiveState
        defender.getState().getPassiveState().set("Hyperdrive:stack", 5);

        ActionResult result = nonStallResult(Action.HARD_STRIKE, 20);
        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");

        assertEquals(0, defender.getState().getPassiveState().getInt("Hyperdrive:stack"),
                "Hyperdrive stack must reset to 0 when the robot takes damage");
    }

    // =========================================================================
    // PHASE_OUT ("VoidWalker") — dodge first attack each turn
    // =========================================================================

    @Test
    void phaseOut_initBattleState_setsDodgeAvailable() {
        ExecutionFrame frame = buildFrame("VoidWalker", 100, 100, 100, 0);

        passiveExecutor.initBattleState(frame);

        assertTrue(frame.getState().getPassiveState().getBoolean("PhaseOut:dodgeAvailable"));
    }

    @Test
    void phaseOut_firstAttack_isDodged() {
        ExecutionFrame attacker = buildFrame("Nobody", 100, 100, 100, 10);
        // Defender (VoidWalker) starts at 70 HP after ActionExecutor applied 30 damage
        ExecutionFrame defender = buildFrame("VoidWalker", 70, 100, 100, 0);
        defender.getState().getPassiveState().set("PhaseOut:dodgeAvailable", true);

        ActionResult result = nonStallResult(Action.HARD_STRIKE, 30);

        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");

        // All damage undone: HP restored to 100, damageDealt reduced to 0
        assertEquals(100, defender.getState().getHp(), "HP must be fully restored after dodge");
        assertEquals(0, result.getDamageDealt(), "damageDealt must be 0 after full dodge");
        assertFalse(defender.getState().getPassiveState().getBoolean("PhaseOut:dodgeAvailable"),
                "dodgeAvailable must be false after first dodge");
    }

    @Test
    void phaseOut_secondAttackSameTurn_notDodged() {
        ExecutionFrame attacker = buildFrame("Nobody", 100, 100, 100, 10);
        ExecutionFrame defender = buildFrame("VoidWalker", 100, 100, 100, 0);
        // Manually set dodge exhausted (first hit already consumed it)
        defender.getState().getPassiveState().set("PhaseOut:dodgeAvailable", false);

        // Second attack same turn: 80 HP after ActionExecutor applied 20 damage
        defender.getState().setHp(80);
        ActionResult result = nonStallResult(Action.HARD_STRIKE, 20);

        passiveExecutor.applyPostAction(attacker, defender, Action.HARD_STRIKE, result, 1, "A");

        // Dodge unavailable → attack connects, HP stays at 80
        assertEquals(80, defender.getState().getHp(), "Second attack must connect (no dodge)");
        assertEquals(20, result.getDamageDealt(), "damageDealt must remain 20 for un-dodged hit");
    }

    @Test
    void phaseOut_resetTurnState_restoresDodgeAvailability() {
        ExecutionFrame frame = buildFrame("VoidWalker", 100, 100, 100, 0);
        // Exhaust dodge first (e.g., took a hit this turn)
        frame.getState().getPassiveState().set("PhaseOut:dodgeAvailable", false);

        passiveExecutor.resetTurnState(frame);

        assertTrue(frame.getState().getPassiveState().getBoolean("PhaseOut:dodgeAvailable"),
                "resetTurnState must restore dodge availability for next turn");
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Builds an ExecutionFrame with the given robot name (used for passive lookup)
     * and key combat stats. The robot name maps to a RobotPassive via byRobotName().
     *
     * @param robotName       matches a RobotPassive.robotName for passive lookup
     * @param hp              current HP in the battle state
     * @param battery         current battery in the battle state
     * @param systemIntegrity max HP (robot stat, used for overheal cap)
     * @param wattage         regen stat (used in passive bonus calculations)
     */
    private ExecutionFrame buildFrame(String robotName, int hp, int battery,
                                      int systemIntegrity, int wattage) {
        Robot robot = Robot.builder()
                .name(robotName)
                .systemIntegrity(systemIntegrity)
                .battery(battery)
                .wattage(wattage)
                .coreImpact(10)
                .chassisArmor(0)
                .firewallStrength(0)
                .exploitPower(0)
                .clockSpeed(50)
                .recovery(0)
                .stability(0)
                .build();

        RobotBattleState state = RobotBattleState.builder()
                .hp(hp)
                .battery(battery)
                .armor(0)
                .firewall(0)
                .stability(0)
                .heat(0)
                .build();

        return ExecutionFrame.builder()
                .robot(robot)
                .state(state)
                .parsedScript(new ParsedScript(List.of()))
                .pointerIndex(0)
                .branchStack(new ArrayDeque<>())
                .build();
    }

    private ActionResult nonStallResult(Action action, int damageDealt) {
        return ActionResult.builder()
                .actionTaken(action)
                .stalledDueToInsufficientBattery(false)
                .damageDealt(damageDealt)
                .batterySpent(15)
                .build();
    }
}
