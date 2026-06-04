package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.parser.ParsedScript;
import com.algorig.algorig_backend.parser.ScriptParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Edge-case integration tests for BattleEngine.
 * Each test uses full engine simulation (engine.simulate()) to verify
 * observable outcomes: winner label, HP, log entry types, action sequences.
 */
class BattleEngineEdgeCasesTest {

    private BattleEngine engine;
    private ScriptParser parser;

    @BeforeEach
    void setUp() {
        parser = new ScriptParser();
        engine = new BattleEngine(
                new ActionExecutor(), new ConditionEvaluator(),
                new NarrativeEngine(), new ExpressionEvaluator(),
                new PassiveExecutor());
    }

    // =========================================================================
    // Battery depletion — winner label correctness (HIGH-RISK)
    // =========================================================================

    @Test
    void batteryDepletion_robotBWins_whenARanOutOfBattery() {
        // Robot A: battery stat=1 → initial battle battery=1, passive drain=10/turn
        // Turn 1: A stalls (1 < any action cost), end-of-turn drain: 1-10=-9 → depleted
        // processBatteryDrain: actor="A" → winnerActor = "B"
        Robot robotA = buildRobot(100, 0, 0, 50, 1, 0, 0, 0, 0);
        Robot robotB = buildRobot(100, 0, 0,  0, 100, 30, 0, 0, 0);

        BattleState state = engine.simulate(robotA, buildScript("HardStrike"),
                                             robotB, buildScript("Patch"),
                                             BattleEngine.DEFAULT_MAX_TURNS);

        assertEquals("B", state.getWinnerId(),
                "Robot B must win when Robot A's battery depletes");
        assertNotEquals("A", state.getWinnerId());
    }

    @Test
    void batteryDepletion_winnerLabel_matchesActualWinner() {
        // When a battery-depletion win occurs, the BATTERY_DRAIN log entry actor is the
        // depleted robot, and state.getWinnerId() must be that robot's OPPONENT.
        Robot robotA = buildRobot(100, 0, 0, 50, 1, 0, 0, 0, 0);
        Robot robotB = buildRobot(100, 0, 0,  0, 100, 30, 0, 0, 0);

        BattleState state = engine.simulate(robotA, buildScript("HardStrike"),
                                             robotB, buildScript("Patch"),
                                             BattleEngine.DEFAULT_MAX_TURNS);

        BattleLogEntry drainEntry = state.getLog().stream()
                .filter(e -> "BATTERY_DRAIN".equals(e.getEntryType())
                          && e.getAttackerBatteryAfter() == 0)
                .findFirst()
                .orElseThrow(() -> new AssertionError("Expected BATTERY_DRAIN entry where battery → 0"));

        // The depleted robot's actor label must be the OPPOSITE of the winner
        String depletedActor = drainEntry.getActor();
        String expectedWinner = "A".equals(depletedActor) ? "B" : "A";
        assertEquals(expectedWinner, state.getWinnerId(),
                "Winner must be the opponent of the depleted robot; depleted=" + depletedActor);
    }

    // =========================================================================
    // REPEAT block — exact iteration count
    // =========================================================================

    @Test
    void repeatBlock_executesExactlyThreeIterations() {
        // Parser expands REPEAT 3 into: START marker, HardStrike, LOOP marker, HardStrike,
        // LOOP marker, HardStrike, END marker — then Patch.
        // maxTurns=4 covers exactly one full script cycle: 3 HardStrikes + 1 Patch.
        Robot robotA = buildRobot(1000, 10, 0, 50, 100, 30, 0, 0, 0);
        Robot robotB = buildRobot(10000, 0,  0,  0, 100, 30, 0, 0, 0);

        ParsedScript scriptA = buildScript("REPEAT 3\n  HardStrike\nEND REPEAT\nPatch");
        ParsedScript scriptB = buildScript("Patch");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB, 4);

        List<BattleLogEntry> aActions = state.getLog().stream()
                .filter(e -> "A".equals(e.getActor()) && "ACTION".equals(e.getEntryType()))
                .toList();

        long hardStrikes = aActions.stream()
                .filter(e -> e.getActionTaken() == Action.HARD_STRIKE).count();
        long patches = aActions.stream()
                .filter(e -> e.getActionTaken() == Action.PATCH).count();

        assertEquals(3, hardStrikes, "REPEAT 3 must produce exactly 3 HARD_STRIKE actions");
        assertEquals(1, patches, "One PATCH must follow the REPEAT block");
        assertEquals(4, aActions.size(), "Total actions in 4 turns must be 4");
    }

    // =========================================================================
    // SET memory — variable accessible in condition
    // =========================================================================

    @Test
    void setMemory_variableUsableInCondition() {
        // Script: SET myVar=99, then IF myVar==99 → Patch, END IF, HardStrike
        // Turn 1: SET (no turn), IF evaluates myVar(99)==99 → true → PATCH
        // Turn 2: script resumes after IF block → HARD_STRIKE
        Robot robotA = buildRobot(100, 5, 0, 50, 100, 30, 0, 0, 10);
        Robot robotB = buildRobot(10000, 0, 0,  0, 100, 30, 0, 0, 0);

        ParsedScript scriptA = buildScript(
                "SET myVar = 99\nIF myVar == 99\n  Patch\nEND IF\nHardStrike");
        ParsedScript scriptB = buildScript("Patch");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB, 2);

        List<BattleLogEntry> aActions = state.getLog().stream()
                .filter(e -> "A".equals(e.getActor()) && "ACTION".equals(e.getEntryType()))
                .toList();

        assertEquals(2, aActions.size());
        assertEquals(Action.PATCH, aActions.get(0).getActionTaken(),
                "Turn 1 must be PATCH because myVar==99 is true after SET");
        assertEquals(Action.HARD_STRIKE, aActions.get(1).getActionTaken(),
                "Turn 2 must be HARD_STRIKE (after IF block)");

        // Also verify the MEMORY_SET log entry exists with correct values
        BattleLogEntry setEntry = state.getLog().stream()
                .filter(e -> "MEMORY_SET".equals(e.getEntryType()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Expected MEMORY_SET log entry"));
        assertEquals("myVar", setEntry.getMemoryVarName());
        assertEquals(99, setEntry.getMemoryVarNewValue());
    }

    // =========================================================================
    // UPDATE memory — variable persists and increments across loops
    // =========================================================================

    @Test
    void updateMemory_incrementsAcrossLoops() {
        // Script: UPDATE counter+=1, IF counter>0 → HardStrike END IF, Patch
        // Turn 1: counter 0→1, IF 1>0 → HardStrike
        // Turn 2: script continues → Patch
        // Turn 3: script loops, counter 1→2, IF 2>0 → HardStrike
        Robot robotA = buildRobot(100, 10, 0, 50, 100, 30, 0, 0, 0);
        Robot robotB = buildRobot(10000, 0,  0,  0, 100, 30, 0, 0, 0);

        ParsedScript scriptA = buildScript(
                "UPDATE counter += 1\nIF counter > 0\n  HardStrike\nEND IF\nPatch");
        ParsedScript scriptB = buildScript("Patch");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB, 3);

        List<BattleLogEntry> aActions = state.getLog().stream()
                .filter(e -> "A".equals(e.getActor()) && "ACTION".equals(e.getEntryType()))
                .toList();

        assertEquals(Action.HARD_STRIKE, aActions.get(0).getActionTaken(),
                "Turn 1: counter goes 0→1, condition counter>0 fires HardStrike");
        assertEquals(Action.PATCH, aActions.get(1).getActionTaken(),
                "Turn 2: script continues past IF block → Patch");
        assertEquals(Action.HARD_STRIKE, aActions.get(2).getActionTaken(),
                "Turn 3: counter persists (now 2), condition still true → HardStrike");

        // Verify counter persisted: second UPDATE log must show oldValue=1
        List<BattleLogEntry> updateEntries = state.getLog().stream()
                .filter(e -> "MEMORY_UPDATE".equals(e.getEntryType()))
                .toList();
        assertTrue(updateEntries.size() >= 2, "Expected at least 2 UPDATE log entries");
        assertEquals(0, updateEntries.get(0).getMemoryVarOldValue(), "First update: 0→1");
        assertEquals(1, updateEntries.get(0).getMemoryVarNewValue());
        assertEquals(1, updateEntries.get(1).getMemoryVarOldValue(), "Second update: 1→2 (cross-loop persistence)");
        assertEquals(2, updateEntries.get(1).getMemoryVarNewValue());
    }

    // =========================================================================
    // ELSE IF — correct branch selected at mid-HP
    // =========================================================================

    @Test
    void elseIf_correctBranch_midHp() {
        // Robot A starts at 60 HP (systemIntegrity=60).
        // Script: IF myHP>80 → HardStrike ELSE IF myHP>40 → Patch ELSE → HeavyAttack END IF
        // 60 > 80 is false; 60 > 40 is true → PATCH
        Robot robotA = buildRobot(60, 5, 0, 50, 100, 30, 0, 0, 10);
        Robot robotB = buildRobot(10000, 0, 0,  0, 100, 30, 0, 0, 0);

        ParsedScript scriptA = buildScript(
                "IF myHP > 80\n  HardStrike\nELSE IF myHP > 40\n  Patch\nELSE\n  HeavyAttack\nEND IF");
        ParsedScript scriptB = buildScript("Patch");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB, 1);

        List<BattleLogEntry> aActions = state.getLog().stream()
                .filter(e -> "A".equals(e.getActor()) && "ACTION".equals(e.getEntryType()))
                .toList();

        assertEquals(1, aActions.size());
        assertEquals(Action.PATCH, aActions.get(0).getActionTaken(),
                "ELSE IF myHP > 40 branch must fire when HP=60");
        assertNotEquals(Action.HARD_STRIKE, aActions.get(0).getActionTaken());
        assertNotEquals(Action.HEAVY_ATTACK, aActions.get(0).getActionTaken());
    }

    // =========================================================================
    // turnNumber condition
    // =========================================================================

    @Test
    void turnNumber_conditionWorks() {
        // Turn 1: turnNumber==1 → HardStrike; turns 2+: ELSE → Patch
        Robot robotA = buildRobot(1000, 1, 0, 50, 100, 30, 0, 0, 0);
        Robot robotB = buildRobot(10000, 0, 0,  0, 100, 30, 0, 0, 0);

        ParsedScript scriptA = buildScript(
                "IF turnNumber == 1\n  HardStrike\nELSE\n  Patch\nEND IF");
        ParsedScript scriptB = buildScript("Patch");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB, 3);

        List<BattleLogEntry> aActions = state.getLog().stream()
                .filter(e -> "A".equals(e.getActor()) && "ACTION".equals(e.getEntryType()))
                .toList();

        assertEquals(3, aActions.size());
        assertEquals(Action.HARD_STRIKE, aActions.get(0).getActionTaken(),
                "Turn 1: turnNumber==1 is true → HARD_STRIKE");
        assertEquals(Action.PATCH, aActions.get(1).getActionTaken(),
                "Turn 2: turnNumber==1 is false → ELSE → PATCH");
        assertEquals(Action.PATCH, aActions.get(2).getActionTaken(),
                "Turn 3: turnNumber==1 is false → ELSE → PATCH");
    }

    // =========================================================================
    // STACK_OVERFLOW → CPU_STALL(overload) recovery cycle
    // =========================================================================

    @Test
    void stackOverflow_followedByCpuStall_thenFiresAgain() {
        // STACK_OVERFLOW costs 60 battery, sets overloaded=true.
        // Next turn: ActionExecutor detects overloaded → returns CPU_STALL(stalledDueToOverload).
        // Turn after: STACK_OVERFLOW fires again.
        // wattage=60 keeps battery stable (60 cost, 60 regen per successful action).
        Robot robotA = buildRobot(1000, 10, 0, 50, 100, 60, 0, 0, 0);
        Robot robotB = buildRobot(10000, 0,  0,  0, 100, 30, 0, 0, 0);

        ParsedScript scriptA = buildScript("StackOverflow");
        ParsedScript scriptB = buildScript("Patch");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB, 3);

        List<BattleLogEntry> aActions = state.getLog().stream()
                .filter(e -> "A".equals(e.getActor()) && "ACTION".equals(e.getEntryType()))
                .toList();

        assertEquals(3, aActions.size());
        assertEquals(Action.STACK_OVERFLOW, aActions.get(0).getActionTaken(),
                "Turn 1: STACK_OVERFLOW fires");
        assertEquals(Action.CPU_STALL, aActions.get(1).getActionTaken(),
                "Turn 2: overload recovery → CPU_STALL");
        assertTrue(aActions.get(1).isStalledDueToOverload(),
                "Turn 2 stall must be flagged stalledDueToOverload (not battery)");
        assertFalse(aActions.get(1).isStalledDueToInsufficientBattery(),
                "Turn 2 stall must NOT be a battery stall");
        assertEquals(Action.STACK_OVERFLOW, aActions.get(2).getActionTaken(),
                "Turn 3: STACK_OVERFLOW fires again after recovery");
    }

    // =========================================================================
    // Turn-limit tie-break: higher HP wins
    // =========================================================================

    @Test
    void turnLimit_robotWithHigherHp_wins() {
        // Both robots use PATCH (no damage to each other).
        // Robot A starts with 100 HP, Robot B with 60 HP.
        // At maxTurns=5, A still has 100 HP and B has 60 HP → A wins.
        Robot robotA = buildRobot(100, 0, 0, 50, 100, 30, 0, 0, 0);
        Robot robotB = buildRobot(60,  0, 0,  0, 100, 30, 0, 0, 0);

        BattleState state = engine.simulate(
                robotA, buildScript("Patch"),
                robotB, buildScript("Patch"),
                5);

        assertEquals("A", state.getWinnerId(),
                "Robot A (100 HP) must win over Robot B (60 HP) at turn limit");
        assertEquals(5, state.getCurrentTurn());
    }

    // =========================================================================
    // Turn-limit tie-break: equal HP → DRAW via mutual damage
    // =========================================================================

    @Test
    void turnLimit_equalHpAfterMutualDamage_isDraw() {
        // Both robots deal 5 damage per turn to each other (coreImpact=5, no armor).
        // Robot A goes first (clockSpeed=50). After N turns: both have taken N×5 damage.
        // At maxTurns=5: A HP = 100-25=75, B HP = 100-25=75 → DRAW.
        Robot robotA = buildRobot(100, 5, 0, 50, 100, 30, 0, 0, 0);
        Robot robotB = buildRobot(100, 5, 0,  0, 100, 30, 0, 0, 0);

        BattleState state = engine.simulate(
                robotA, buildScript("HardStrike"),
                robotB, buildScript("HardStrike"),
                5);

        assertEquals("DRAW", state.getWinnerId(),
                "Equal HP after mutual damage at turn limit must produce DRAW");
    }

    // =========================================================================
    // Helpers — identical signatures to BattleEngineTest
    // =========================================================================

    private Robot buildRobot(int systemIntegrity, int coreImpact, int chassisArmor,
                              int clockSpeed, int battery, int wattage,
                              int exploitPower, int firewallStrength, int recovery) {
        return Robot.builder()
                .systemIntegrity(systemIntegrity)
                .coreImpact(coreImpact)
                .chassisArmor(chassisArmor)
                .clockSpeed(clockSpeed)
                .battery(battery)
                .wattage(wattage)
                .exploitPower(exploitPower)
                .firewallStrength(firewallStrength)
                .recovery(recovery)
                .build();
    }

    private ParsedScript buildScript(String content) {
        return parser.parse(content);
    }
}
