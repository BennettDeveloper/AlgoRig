package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.parser.ParsedScript;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayDeque;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for ActionExecutor scenarios NOT covered by ActionExecutorTest:
 * STACK_OVERFLOW, BATTERY_EQUALIZATION, SYSTEM_SCAN, and edge cases.
 *
 * Does not duplicate any existing tests.
 */
class ActionExecutorGapsTest {

    private ActionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new ActionExecutor();
    }

    // -------------------------------------------------------------------------
    // STACK_OVERFLOW
    // -------------------------------------------------------------------------

    @Test
    void stackOverflow_dealsDamageAndSetsOverloadFlag() {
        // damage = max(1, 3 * coreImpact - chassisArmor/2) = max(1, 60 - 0) = 60
        // cost = 60 (fixed for STACK_OVERFLOW)
        ExecutionFrame attacker = buildFrame(20, 0, 0, 0, 0, 80, 0, 0, 100);
        ExecutionFrame defender = buildFrame(0,  0, 0, 0, 0, 60, 0, 0, 100);

        ActionResult result = executor.execute(Action.STACK_OVERFLOW, attacker, defender);

        assertEquals(Action.STACK_OVERFLOW, result.getActionTaken());
        assertEquals(60, result.getDamageDealt());
        assertEquals(40, defender.getState().getHp());      // 100 - 60
        assertEquals(20, attacker.getState().getBattery()); // 80 - 60 + 0 wattage
        assertTrue(attacker.getState().getPassiveState().getBoolean("StackOverflow:overloaded"),
                "Overload flag must be set after STACK_OVERFLOW for next-turn stall");
        assertFalse(result.isStalledDueToInsufficientBattery());
        assertFalse(result.isStalledDueToOverload());
    }

    @Test
    void stackOverflow_overloadFlag_causesStalledDueToOverloadOnNextExecute() {
        // First execute: STACK_OVERFLOW sets the overload flag
        ExecutionFrame attacker = buildFrame(20, 0, 0, 0, 0, 80, 0, 0, 100);
        ExecutionFrame defender = buildFrame(0,  0, 0, 0, 0, 60, 0, 0, 100);
        executor.execute(Action.STACK_OVERFLOW, attacker, defender);

        // Second execute: any action triggers the overload recovery stall
        int defenderHpBefore = defender.getState().getHp();
        ActionResult stallResult = executor.execute(Action.HARD_STRIKE, attacker, defender);

        assertEquals(Action.CPU_STALL, stallResult.getActionTaken());
        assertTrue(stallResult.isStalledDueToOverload(),
                "Robot that used STACK_OVERFLOW must stall on the following turn");
        assertFalse(stallResult.isStalledDueToInsufficientBattery());
        assertEquals(0, stallResult.getDamageDealt());
        assertEquals(0, stallResult.getBatterySpent());
        assertEquals(defenderHpBefore, defender.getState().getHp(), "No damage during overload stall");

        // Overload flag must be cleared after the stall turn
        assertFalse(attacker.getState().getPassiveState().getBoolean("StackOverflow:overloaded"),
                "Overload flag must clear after the stall turn resolves");
    }

    @Test
    void stackOverflow_minimumDamageFallback() {
        // Even with coreImpact=0 the damage floor is 1: max(1, 0 - 0) = 1
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 80, 0, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 0, 100, 100);

        ActionResult result = executor.execute(Action.STACK_OVERFLOW, attacker, defender);

        assertEquals(1, result.getDamageDealt(), "Minimum damage is 1 even with coreImpact=0");
    }

    // -------------------------------------------------------------------------
    // BATTERY_EQUALIZATION
    // -------------------------------------------------------------------------

    @Test
    void batteryEqualization_equalizesRemainingBatteriesAfterCost() {
        // BATTERY_EQUALIZATION costs 50. Equalization uses (attacker_battery - 50 + defender_battery) / 2.
        // Attacker 90, wattage 0: post-cost = 40. Defender 10.
        // avg = (40 + 10) / 2 = 25.
        // Attacker = min(100, 25 + 0 wattage) = 25. Defender = 25.
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 90, 0, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 10, 0, 0, 100);
        attacker.getState().setBattery(90);
        defender.getState().setBattery(10);

        ActionResult result = executor.execute(Action.BATTERY_EQUALIZATION, attacker, defender);

        assertEquals(Action.BATTERY_EQUALIZATION, result.getActionTaken());
        assertFalse(result.isStalledDueToInsufficientBattery());
        assertEquals(25, attacker.getState().getBattery(), "Attacker battery after equalization");
        assertEquals(25, defender.getState().getBattery(), "Defender battery after equalization");
        assertEquals(25, result.getBatteryEqualized(), "batteryEqualized field must carry the avg");
        assertEquals(50, result.getBatterySpent());
    }

    @Test
    void batteryEqualization_usesIntegerDivisionRoundingDown() {
        // Attacker 81, wattage 0: post-cost = 31. Defender 10. Total = 41.
        // avg = 41 / 2 = 20 (integer division, not 20.5 rounded up)
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 81, 0, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 10, 0, 0, 100);
        attacker.getState().setBattery(81);
        defender.getState().setBattery(10);

        executor.execute(Action.BATTERY_EQUALIZATION, attacker, defender);

        assertEquals(20, attacker.getState().getBattery(), "Integer division must round down");
        assertEquals(20, defender.getState().getBattery(), "Integer division must round down");
    }

    @Test
    void batteryEqualization_stallsWhenAttackerBatteryBelowCost() {
        // Cost = 50; attacker with 40 battery cannot afford it
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 40, 0, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 0, 0, 100);
        attacker.getState().setBattery(40);
        int defenderBatteryBefore = defender.getState().getBattery();

        ActionResult result = executor.execute(Action.BATTERY_EQUALIZATION, attacker, defender);

        assertEquals(Action.CPU_STALL, result.getActionTaken());
        assertTrue(result.isStalledDueToInsufficientBattery());
        assertEquals(0, result.getBatterySpent());
        assertEquals(defenderBatteryBefore, defender.getState().getBattery(),
                "Defender battery must be untouched on stall");
    }

    // -------------------------------------------------------------------------
    // SYSTEM_SCAN
    // -------------------------------------------------------------------------

    @Test
    void systemScan_setsScanning_doesNotDealDamage() {
        // clockSpeed=0 → cost = max(3, 8 - 0) = 8
        // Defender HP must remain untouched; attacker enters scanning state
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 60, 0, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 0, 0, 100);

        ActionResult result = executor.execute(Action.SYSTEM_SCAN, attacker, defender);

        assertEquals(Action.SYSTEM_SCAN, result.getActionTaken());
        assertFalse(result.isStalledDueToInsufficientBattery());
        assertEquals(100, defender.getState().getHp(), "SYSTEM_SCAN must not reduce defender HP");
        assertEquals(0, result.getDamageDealt());
        assertTrue(attacker.getState().isScanning(), "Attacker must enter scanning state");
        assertEquals(52, attacker.getState().getBattery(), "Battery = 60 - 8 (cost) + 0 (wattage)");

        int scanDuration = result.getScanDuration();
        assertTrue(scanDuration >= 2 && scanDuration <= 5,
                "Scan duration must be in range [2, 5]; was " + scanDuration);
        assertEquals(scanDuration, attacker.getState().getScanTurnsRemaining());
    }

    @Test
    void systemScan_fasterRobotPaysSmallerCost() {
        // clockSpeed=50 → cost = max(3, 8 - 5) = max(3, 3) = 3
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 60, 0, 50, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 0,  0, 100);

        executor.execute(Action.SYSTEM_SCAN, attacker, defender);

        assertEquals(57, attacker.getState().getBattery(), "Battery = 60 - 3 (fast-robot cost) + 0 wattage");
    }

    // -------------------------------------------------------------------------
    // VIRUS_UPLOAD — damage component
    // -------------------------------------------------------------------------

    @Test
    void virusUpload_reducesDefenderFirewallNotHp() {
        // VIRUS_UPLOAD only reduces firewall. It does NOT reduce HP.
        // damageDealt in the ActionResult is the firewall reduction amount (a repurposed field).
        // exploitPower=30 → reduction = 30/3 = 10
        ExecutionFrame attacker = buildFrame(0, 0, 30, 0, 0, 60, 5, 20, 100);
        ExecutionFrame defender = buildFrame(0,  0,  0, 40, 0, 60, 5,  0, 100);

        ActionResult result = executor.execute(Action.VIRUS_UPLOAD, attacker, defender);

        assertEquals(Action.VIRUS_UPLOAD, result.getActionTaken());
        assertEquals(100, defender.getState().getHp(),
                "VIRUS_UPLOAD must not reduce defender HP — it only drains firewall");
        assertEquals(30, defender.getState().getFirewall(),
                "Defender firewall = 40 - 10 (exploitPower/3)");
        assertEquals(10, result.getDamageDealt(),
                "damageDealt carries the firewall reduction amount, not HP damage");
    }

    // -------------------------------------------------------------------------
    // Minimum damage floor
    // -------------------------------------------------------------------------

    @Test
    void hardStrike_minimumDamageIsOne_evenAgainstHighArmor() {
        // coreImpact=0, defender chassisArmor=1000 → raw = 0 - 500 = -500 → max(1, -500) = 1
        // clockSpeed=50 → cost = max(5, 20-5) = 15; attacker battery=60 is enough
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 60, 0, 50, 100);
        ExecutionFrame defender = buildFrame(0, 1000, 0, 0, 0, 60, 0, 0, 100);

        ActionResult result = executor.execute(Action.HARD_STRIKE, attacker, defender);

        assertFalse(result.isStalledDueToInsufficientBattery());
        assertEquals(1, result.getDamageDealt(),
                "Damage floor must be 1 regardless of armor vs coreImpact");
        assertEquals(99, defender.getState().getHp());
    }

    @Test
    void powerSurge_minimumDamageIsOne_evenAgainstHighFirewall() {
        // exploitPower=0, defender firewallStrength=1000 → raw = 0 - 500 = -500 → max(1,-500) = 1
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 60, 0, 50, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 1000, 0, 60, 0, 0, 100);
        // Also set defender's state firewall to a high value
        defender.getState().setFirewall(1000);

        ActionResult result = executor.execute(Action.POWER_SURGE, attacker, defender);

        assertFalse(result.isStalledDueToInsufficientBattery());
        assertEquals(1, result.getDamageDealt(),
                "POWER_SURGE damage floor must be 1 regardless of firewall vs exploitPower");
    }

    // -------------------------------------------------------------------------
    // Helper (mirrors ActionExecutorTest.buildFrame for self-contained tests)
    // -------------------------------------------------------------------------

    private ExecutionFrame buildFrame(int coreImpact, int chassisArmor, int exploitPower,
                                      int firewallStrength, int recovery, int battery,
                                      int wattage, int clockSpeed, int systemIntegrity) {
        Robot robot = Robot.builder()
                .coreImpact(coreImpact)
                .chassisArmor(chassisArmor)
                .exploitPower(exploitPower)
                .firewallStrength(firewallStrength)
                .recovery(recovery)
                .battery(battery)
                .wattage(wattage)
                .clockSpeed(clockSpeed)
                .systemIntegrity(systemIntegrity)
                .build();

        RobotBattleState state = RobotBattleState.builder()
                .hp(systemIntegrity)
                .battery(battery)
                .heat(0)
                .firewall(firewallStrength)
                .armor(chassisArmor)
                .build();

        return ExecutionFrame.builder()
                .robot(robot)
                .state(state)
                .parsedScript(new ParsedScript(Collections.emptyList()))
                .branchStack(new ArrayDeque<>())
                .build();
    }
}
