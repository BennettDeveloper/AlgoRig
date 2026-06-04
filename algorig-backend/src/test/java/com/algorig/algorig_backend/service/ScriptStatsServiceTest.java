package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.ScriptStatsDto;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.ScriptStats;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptStatsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ScriptStatsServiceTest {

    @Mock ScriptStatsRepository scriptStatsRepository;
    @Mock BattleRepository battleRepository;
    @Mock RobotRepository robotRepository;

    @InjectMocks ScriptStatsService scriptStatsService;

    // -------------------------------------------------------------------------
    // updateAfterBattle() — self-battle
    // -------------------------------------------------------------------------

    @Test
    void updateAfterBattle_selfBattle_countsAsDrawNotWin() {
        Script script = buildScript(1L);
        Battle battle = buildSelfBattle(script);
        ScriptStats stats = new ScriptStats();
        stats.setScript(script);

        given(scriptStatsRepository.findByScript(script)).willReturn(Optional.of(stats));
        given(scriptStatsRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        scriptStatsService.updateAfterBattle(battle);

        ArgumentCaptor<ScriptStats> captor = ArgumentCaptor.forClass(ScriptStats.class);
        verify(scriptStatsRepository, atLeastOnce()).save(captor.capture());
        ScriptStats saved = captor.getValue();
        assertEquals(1, saved.getDraws());
        assertEquals(0, saved.getWins());
        assertEquals(0, saved.getLosses());
        assertEquals(1, saved.getTotalBattles());
    }

    @Test
    void updateAfterBattle_selfBattle_incrementsTimesUsed() {
        Script script = buildScript(1L);
        Battle battle = buildSelfBattle(script);
        ScriptStats stats = new ScriptStats();
        stats.setScript(script);
        stats.setTimesUsed(4);

        given(scriptStatsRepository.findByScript(script)).willReturn(Optional.of(stats));
        given(scriptStatsRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        scriptStatsService.updateAfterBattle(battle);

        ArgumentCaptor<ScriptStats> captor = ArgumentCaptor.forClass(ScriptStats.class);
        verify(scriptStatsRepository, atLeastOnce()).save(captor.capture());
        assertEquals(5, captor.getValue().getTimesUsed());
    }

    // -------------------------------------------------------------------------
    // resetStats()
    // -------------------------------------------------------------------------

    @Test
    void resetStats_zerosAllCountersAndRates() {
        Script script = buildScript(1L);
        ScriptStats stats = new ScriptStats();
        stats.setScript(script);
        stats.setWins(10);
        stats.setLosses(5);
        stats.setDraws(2);
        stats.setTotalBattles(17);
        stats.setTimesUsed(20);
        stats.setWinRate(58.8);
        stats.setTierNormalizedWinRate(61.3);
        stats.setDistinctContexts(8);

        given(scriptStatsRepository.findByScript(script)).willReturn(Optional.of(stats));
        given(scriptStatsRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        scriptStatsService.resetStats(script, LocalDateTime.now());

        ArgumentCaptor<ScriptStats> captor = ArgumentCaptor.forClass(ScriptStats.class);
        verify(scriptStatsRepository).save(captor.capture());
        ScriptStats saved = captor.getValue();
        assertEquals(0, saved.getWins());
        assertEquals(0, saved.getLosses());
        assertEquals(0, saved.getDraws());
        assertEquals(0, saved.getTotalBattles());
        assertEquals(0, saved.getTimesUsed());
        assertEquals(0.0, saved.getWinRate());
        assertEquals(0.0, saved.getTierNormalizedWinRate());
        assertEquals(0, saved.getDistinctContexts());
    }

    @Test
    void resetStats_setsStatsSinceTimestamp() {
        Script script = buildScript(1L);
        // Return an existing row so getOrCreate() does not itself call save().
        // That leaves exactly one save() call (in resetStats itself), making
        // the ArgumentCaptor unambiguous.
        ScriptStats existing = new ScriptStats();
        existing.setScript(script);
        given(scriptStatsRepository.findByScript(script)).willReturn(Optional.of(existing));
        given(scriptStatsRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        LocalDateTime since = LocalDateTime.of(2026, 1, 15, 12, 0);
        scriptStatsService.resetStats(script, since);

        ArgumentCaptor<ScriptStats> captor = ArgumentCaptor.forClass(ScriptStats.class);
        verify(scriptStatsRepository).save(captor.capture());
        assertEquals(since, captor.getValue().getStatsSince());
    }

    // -------------------------------------------------------------------------
    // getStatsDtoForScript() — no stats row → empty stats
    // -------------------------------------------------------------------------

    @Test
    void getStatsDtoForScript_noStats_returnsZeroedEmptyDto() {
        Script script = buildScript(1L);
        given(scriptStatsRepository.findByScript(script)).willReturn(Optional.empty());

        ScriptStatsDto dto = scriptStatsService.getStatsDtoForScript(script);

        assertEquals(0, dto.getWins());
        assertEquals(0, dto.getTotalBattles());
        assertEquals(0.0, dto.getWinRate());
        assertEquals("Unranked", dto.getDifficultyLabel());
    }

    // -------------------------------------------------------------------------
    // computeDifficultyLabel() — tested via getStatsDtoForScript()
    // -------------------------------------------------------------------------

    @Test
    void difficultyLabel_unranked_whenBelowBattleThreshold() {
        // totalBattles < 5 → always Unranked regardless of win rate
        assertEquals("Unranked", getDifficultyFor(100.0, 4, 5));
    }

    @Test
    void difficultyLabel_unranked_whenBelowDistinctContextThreshold() {
        // distinctContexts < 3 → always Unranked
        assertEquals("Unranked", getDifficultyFor(90.0, 10, 2));
    }

    @Test
    void difficultyLabel_beginner_at30Percent() {
        assertEquals("Beginner", getDifficultyFor(30.0, 10, 5));
    }

    @Test
    void difficultyLabel_beginner_atExactly40Percent() {
        // Boundary: ≤ 40.0 → Beginner
        assertEquals("Beginner", getDifficultyFor(40.0, 10, 5));
    }

    @Test
    void difficultyLabel_intermediate_atJustAbove40Percent() {
        // Boundary: > 40.0 AND ≤ 60.0 → Intermediate
        assertEquals("Intermediate", getDifficultyFor(41.0, 10, 5));
    }

    @Test
    void difficultyLabel_intermediate_atExactly60Percent() {
        // 60.0 is still Intermediate (≤ 60.0)
        assertEquals("Intermediate", getDifficultyFor(60.0, 10, 5));
    }

    @Test
    void difficultyLabel_advanced_at75Percent() {
        assertEquals("Advanced", getDifficultyFor(75.0, 10, 5));
    }

    @Test
    void difficultyLabel_advanced_atExactly80Percent() {
        // Boundary: ≤ 80.0 → Advanced; > 80.0 → Elite
        assertEquals("Advanced", getDifficultyFor(80.0, 10, 5));
    }

    @Test
    void difficultyLabel_elite_at90Percent() {
        assertEquals("Elite", getDifficultyFor(90.0, 10, 5));
    }

    // -------------------------------------------------------------------------
    // toDto() — win-rate rounding
    // -------------------------------------------------------------------------

    @Test
    void toDto_winRateRoundedToOneDecimalPlace() {
        ScriptStats stats = new ScriptStats();
        stats.setWinRate(66.7);
        stats.setTotalBattles(5);
        stats.setDistinctContexts(3);
        stats.setTierNormalizedWinRate(66.7);

        Script script = buildScript(1L);
        given(scriptStatsRepository.findByScript(script)).willReturn(Optional.of(stats));

        ScriptStatsDto dto = scriptStatsService.getStatsDtoForScript(script);

        assertEquals(66.7, dto.getWinRate(), 0.01);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Script buildScript(Long id) {
        Script s = new Script();
        s.setId(id);
        return s;
    }

    private Battle buildSelfBattle(Script script) {
        Battle b = new Battle();
        b.setScriptA(script);
        b.setScriptB(script); // same instance → same ID → self-battle
        b.setWinnerId("A");
        b.setTotalTurns(5);
        b.setRobotAId(1L);
        b.setRobotBId(2L);
        return b;
    }

    private String getDifficultyFor(double winRate, int totalBattles, int distinctContexts) {
        ScriptStats stats = new ScriptStats();
        stats.setTierNormalizedWinRate(winRate);
        stats.setTotalBattles(totalBattles);
        stats.setDistinctContexts(distinctContexts);
        given(scriptStatsRepository.findByScript(any())).willReturn(Optional.of(stats));
        return scriptStatsService.getStatsDtoForScript(buildScript(99L)).getDifficultyLabel();
    }
}
