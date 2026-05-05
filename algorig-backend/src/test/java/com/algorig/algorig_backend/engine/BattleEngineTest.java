package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.parser.ParsedScript;
import com.algorig.algorig_backend.parser.ScriptParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BattleEngineTest {

    private BattleEngine engine;
    private ScriptParser parser;

    @BeforeEach
    void setUp() {
        parser = new ScriptParser();
        engine = new BattleEngine(new ActionExecutor(), new ConditionEvaluator());
    }

    /**
     * Builds a Robot with all combat stats explicitly set.
     */
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

    /**
     * Parses a script string into a ParsedScript.
     */
    private ParsedScript buildScript(String content) {
        return parser.parse(content);
    }

    // -------------------------------------------------------------------------
    // A robot that only uses HARD_STRIKE eventually defeats a PATCH-only robot
    // -------------------------------------------------------------------------

    @Test
    void hardStrikeEventuallyDefeatsPatch() {
        // A: coreImpact=20, clockSpeed=50 (goes first), battery stays healthy
        // B: recovery=5, low damage, clockSpeed=0
        // Net damage per round = 20 (HARD_STRIKE) - 5 (PATCH heal) = 15
        // B starts at 100 HP → dies within 7 rounds
        Robot robotA = buildRobot(100, 20, 0, 50, 100, 10, 0, 0, 0);
        Robot robotB = buildRobot(100, 0,  0,  0, 100, 10, 0, 0, 5);

        ParsedScript scriptA = buildScript("HARD_STRIKE");
        ParsedScript scriptB = buildScript("PATCH");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB);

        assertEquals("A", state.getWinnerId());
        assertTrue(state.getCurrentTurn() <= BattleEngine.MAX_TURNS);
        assertTrue(state.getCurrentTurn() > 0);
    }

    // -------------------------------------------------------------------------
    // Battle ends immediately when HP reaches 0 (winner is set, loser never acts)
    // -------------------------------------------------------------------------

    @Test
    void battleEndsImmediatelyWhenHpReachesZero() {
        // A one-shots B: coreImpact=50 vs systemIntegrity=1
        Robot robotA = buildRobot(100, 50, 0, 50, 100, 10, 0, 0, 0);
        Robot robotB = buildRobot(1,   0,  0,  0, 100, 10, 0, 0, 0);

        ParsedScript scriptA = buildScript("HARD_STRIKE");
        ParsedScript scriptB = buildScript("SYSTEM_SCAN");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB);

        assertNotNull(state.getWinnerId());
        assertEquals("A", state.getWinnerId());
        // B was killed before it could act — only A's entry for turn 1
        assertEquals(1, state.getLog().size());
        assertEquals("A", state.getLog().get(0).getActor());
        assertEquals(1, state.getCurrentTurn());
    }

    // -------------------------------------------------------------------------
    // MAX_TURNS cap is respected; winner determined by remaining HP
    // -------------------------------------------------------------------------

    @Test
    void maxTurnsCapReturnsDrawWhenHpEqual() {
        // Both robots do SYSTEM_SCAN (no damage), start with equal HP
        // Battery: cost=10, wattage=10 → net zero, never runs out
        Robot robotA = buildRobot(100, 0, 0, 50, 100, 10, 0, 0, 0);
        Robot robotB = buildRobot(100, 0, 0,  0, 100, 10, 0, 0, 0);

        ParsedScript scriptA = buildScript("SYSTEM_SCAN");
        ParsedScript scriptB = buildScript("SYSTEM_SCAN");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB);

        assertEquals("DRAW", state.getWinnerId());
        assertEquals(BattleEngine.MAX_TURNS, state.getCurrentTurn());
    }

    @Test
    void maxTurnsCapReturnsHigherHpWinner() {
        // Both start with 1000 HP. A deals 1 damage/turn; B does SYSTEM_SCAN (no damage).
        // Battery: cost=15, wattage=15 → net zero, never runs out.
        // After 200 turns: A has 1000 HP, B has 800 HP → A wins by HP.
        Robot robotA = buildRobot(1000, 1, 0, 50, 100, 15, 0, 0, 0);
        Robot robotB = buildRobot(1000, 0, 0,  0, 100, 10, 0, 0, 0);

        ParsedScript scriptA = buildScript("HARD_STRIKE");
        ParsedScript scriptB = buildScript("SYSTEM_SCAN");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB);

        assertEquals("A", state.getWinnerId());
        assertEquals(BattleEngine.MAX_TURNS, state.getCurrentTurn());
    }

    // -------------------------------------------------------------------------
    // Script loops: pointer resets to block 0 after the last block
    // -------------------------------------------------------------------------

    @Test
    void scriptLoopsBackAfterLastBlock() {
        // Script A has two actions: HARD_STRIKE then PATCH
        // After executing both, on the 3rd execution it should loop to HARD_STRIKE again
        // B does SYSTEM_SCAN so A won't die; B has high HP so A won't kill B quickly
        Robot robotA = buildRobot(1000, 1, 0, 50, 100, 10, 0, 0, 10);
        Robot robotB = buildRobot(1000, 0, 0,  0, 100, 10, 0, 0, 0);

        ParsedScript scriptA = buildScript("HARD_STRIKE\nPATCH");
        ParsedScript scriptB = buildScript("SYSTEM_SCAN");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB);

        // Extract the log entries where actor = "A"
        List<BattleLogEntry> aEntries = state.getLog().stream()
                .filter(e -> "A".equals(e.getActor()))
                .toList();

        assertTrue(aEntries.size() >= 3, "Expected at least 3 turns of A acting");
        assertEquals(Action.HARD_STRIKE, aEntries.get(0).getActionTaken());
        assertEquals(Action.PATCH,       aEntries.get(1).getActionTaken());
        assertEquals(Action.HARD_STRIKE, aEntries.get(2).getActionTaken()); // loop reset
    }

    // -------------------------------------------------------------------------
    // CPU_STALL occurs when battery runs out
    // -------------------------------------------------------------------------

    @Test
    void cpuStallOccursWhenBatteryDepleted() {
        // A: battery=20, wattage=0 (no regen), clockSpeed=50
        // HARD_STRIKE cost = max(5, 20 - 50/10) = 15
        // Turn 1: battery 20 → 20-15+0=5. Turn 2: 5 < 15 → CPU_STALL
        // B has very low damage so A survives long enough to stall
        Robot robotA = buildRobot(1000, 1, 0, 50, 20, 0, 0, 0, 0);
        Robot robotB = buildRobot(1000, 0, 0,  0, 100, 5, 0, 0, 0);

        ParsedScript scriptA = buildScript("HARD_STRIKE");
        ParsedScript scriptB = buildScript("SYSTEM_SCAN");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB);

        // Find the first stall entry for A
        BattleLogEntry stallEntry = state.getLog().stream()
                .filter(e -> "A".equals(e.getActor()) && e.isStalledDueToInsufficientBattery())
                .findFirst()
                .orElse(null);

        assertNotNull(stallEntry, "Expected a CPU_STALL log entry for actor A");
        assertEquals(Action.CPU_STALL, stallEntry.getActionTaken());
        assertEquals(2, stallEntry.getTurn());
    }

    // -------------------------------------------------------------------------
    // Log entries carry the correct actor label ("A" or "B")
    // -------------------------------------------------------------------------

    @Test
    void logEntriesHaveCorrectActorLabels() {
        // A acts first (higher clockSpeed), so log should alternate A, B, A, B, ...
        Robot robotA = buildRobot(1000, 1, 0, 50, 100, 10, 0, 0, 0);
        Robot robotB = buildRobot(1000, 1, 0,  0, 100, 10, 0, 0, 0);

        ParsedScript scriptA = buildScript("SYSTEM_SCAN");
        ParsedScript scriptB = buildScript("SYSTEM_SCAN");

        BattleState state = engine.simulate(robotA, scriptA, robotB, scriptB);

        List<BattleLogEntry> log = state.getLog();
        assertTrue(log.size() >= 4, "Expected at least 2 full rounds");

        // Each round produces two entries: first A (higher clockSpeed), then B
        for (int i = 0; i < 4; i++) {
            String expected = (i % 2 == 0) ? "A" : "B";
            assertEquals(expected, log.get(i).getActor(),
                    "Expected actor " + expected + " at log index " + i);
        }
    }
}
