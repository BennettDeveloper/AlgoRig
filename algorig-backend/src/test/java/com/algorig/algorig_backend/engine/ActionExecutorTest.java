package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.parser.ParsedScript;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayDeque;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class ActionExecutorTest {

    private ActionExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new ActionExecutor();
    }

    /**
     * Builds a minimal ExecutionFrame. Battery in state is set to the given battery value.
     * Firewall and armor in state are initialized to firewallStrength and chassisArmor respectively.
     */
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

    // -------------------------------------------------------------------------
    // Damage tests
    // -------------------------------------------------------------------------

    @Test
    void hardStrikeDealsCorrectDamage() {
        // coreImpact=30, defender chassisArmor=10
        // damage = max(1, 30 - 10/2) = 25
        ExecutionFrame attacker = buildFrame(30, 0, 0, 0, 0, 60, 5, 20, 100);
        ExecutionFrame defender = buildFrame(0, 10, 0, 0, 0, 60, 5, 0, 100);

        ActionResult result = executor.execute(Action.HARD_STRIKE, attacker, defender);

        assertEquals(Action.HARD_STRIKE, result.getActionTaken());
        assertEquals(25, result.getDamageDealt());
        assertEquals(75, defender.getState().getHp());
        assertFalse(result.isStalledDueToInsufficientBattery());
    }

    @Test
    void heavyAttackDealsCorrectDamage() {
        // coreImpact=30, defender chassisArmor=10
        // damage = max(1, (int)(30*1.5) - 10/2) = max(1, 45 - 5) = 40
        ExecutionFrame attacker = buildFrame(30, 0, 0, 0, 0, 60, 5, 20, 100);
        ExecutionFrame defender = buildFrame(0, 10, 0, 0, 0, 60, 5, 0, 100);

        ActionResult result = executor.execute(Action.HEAVY_ATTACK, attacker, defender);

        assertEquals(Action.HEAVY_ATTACK, result.getActionTaken());
        assertEquals(40, result.getDamageDealt());
        assertEquals(60, defender.getState().getHp());
    }

    @Test
    void powerSurgeDealsCorrectDamage() {
        // exploitPower=40, defender firewallStrength=20
        // damage = max(1, 40 - 20/2) = 30
        ExecutionFrame attacker = buildFrame(0, 0, 40, 0, 0, 60, 5, 20, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 20, 0, 60, 5, 0, 100);

        ActionResult result = executor.execute(Action.POWER_SURGE, attacker, defender);

        assertEquals(Action.POWER_SURGE, result.getActionTaken());
        assertEquals(30, result.getDamageDealt());
        assertEquals(70, defender.getState().getHp());
    }

    // -------------------------------------------------------------------------
    // Heal / restore tests
    // -------------------------------------------------------------------------

    @Test
    void patchHealsCorrectly() {
        // recovery=20, systemIntegrity=100, current hp=100 → still 100
        // Let's set hp below max: use systemIntegrity=100 but initial hp will be 100
        // Better: build frame then manually lower hp
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 20, 60, 5, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 5, 0, 100);
        attacker.getState().setHp(70); // damaged

        ActionResult result = executor.execute(Action.PATCH, attacker, defender);

        assertEquals(Action.PATCH, result.getActionTaken());
        assertEquals(20, result.getHealingDone());
        assertEquals(90, attacker.getState().getHp());
    }

    @Test
    void patchDoesNotOverheal() {
        // recovery=20, current hp=95, max=100 → heals only 5
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 20, 60, 5, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 5, 0, 100);
        attacker.getState().setHp(95);

        ActionResult result = executor.execute(Action.PATCH, attacker, defender);

        assertEquals(5, result.getHealingDone());
        assertEquals(100, attacker.getState().getHp());
    }

    @Test
    void armorPlateRestoresArmor() {
        // chassisArmor=40 → restore = 40/2 = 20, cap at 40
        ExecutionFrame attacker = buildFrame(0, 40, 0, 0, 0, 60, 5, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 5, 0, 100);
        attacker.getState().setArmor(15); // damaged armor

        ActionResult result = executor.execute(Action.ARMOR_PLATE, attacker, defender);

        assertEquals(Action.ARMOR_PLATE, result.getActionTaken());
        assertEquals(35, attacker.getState().getArmor()); // 15 + 20 = 35 (< cap of 40)
    }

    @Test
    void firewallRestoresFirewall() {
        // firewallStrength=40 → restore = 40/2 = 20, cap at 40
        ExecutionFrame attacker = buildFrame(0, 0, 0, 40, 0, 60, 5, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 5, 0, 100);
        attacker.getState().setFirewall(10); // degraded firewall

        ActionResult result = executor.execute(Action.FIREWALL, attacker, defender);

        assertEquals(Action.FIREWALL, result.getActionTaken());
        assertEquals(30, attacker.getState().getFirewall()); // 10 + 20 = 30 (< cap of 40)
    }

    @Test
    void virusUploadReducesDefenderFirewall() {
        // attacker exploitPower=30 → reduction = 30/3 = 10
        ExecutionFrame attacker = buildFrame(0, 0, 30, 0, 0, 60, 5, 20, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 40, 0, 60, 5, 0, 100);
        // defender state.firewall initialized to 40

        ActionResult result = executor.execute(Action.VIRUS_UPLOAD, attacker, defender);

        assertEquals(Action.VIRUS_UPLOAD, result.getActionTaken());
        assertEquals(30, defender.getState().getFirewall()); // 40 - 10
    }

    // -------------------------------------------------------------------------
    // Battery tests
    // -------------------------------------------------------------------------

    @Test
    void insufficientBatteryCausesCpuStall() {
        // HARD_STRIKE cost = max(5, 20 - 0/10) = 20; attacker battery = 5
        ExecutionFrame attacker = buildFrame(30, 0, 0, 0, 0, 5, 5, 0, 100);
        ExecutionFrame defender = buildFrame(0, 10, 0, 0, 0, 60, 5, 0, 100);
        attacker.getState().setBattery(5);

        ActionResult result = executor.execute(Action.HARD_STRIKE, attacker, defender);

        assertEquals(Action.CPU_STALL, result.getActionTaken());
        assertTrue(result.isStalledDueToInsufficientBattery());
        assertEquals(0, result.getBatterySpent());
        assertEquals(0, result.getDamageDealt());
        assertEquals(100, defender.getState().getHp()); // no damage
    }

    @Test
    void batteryDeductedAndWattageAddedAfterAction() {
        // HARD_STRIKE cost = max(5, 20 - 0/10) = 20; battery=50, wattage=10
        // After: 50 - 20 + 10 = 40
        ExecutionFrame attacker = buildFrame(30, 0, 0, 0, 0, 50, 10, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 5, 0, 100);
        attacker.getState().setBattery(50);

        executor.execute(Action.HARD_STRIKE, attacker, defender);

        assertEquals(40, attacker.getState().getBattery());
    }

    @Test
    void batteryIsCappedAt100AfterWattageGain() {
        // SYSTEM_SCAN cost = 10; battery=95, wattage=20
        // Raw: 95 - 10 + 20 = 105 → capped at 100
        ExecutionFrame attacker = buildFrame(0, 0, 0, 0, 0, 95, 20, 0, 100);
        ExecutionFrame defender = buildFrame(0, 0, 0, 0, 0, 60, 5, 0, 100);
        attacker.getState().setBattery(95);

        executor.execute(Action.SYSTEM_SCAN, attacker, defender);

        assertEquals(100, attacker.getState().getBattery());
    }
}
