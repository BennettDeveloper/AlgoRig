package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.UserStatsDto;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.UserStats;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.UserStatsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserStatsServiceTest {

    @Mock UserStatsRepository userStatsRepository;
    @Mock BattleRepository battleRepository;
    @Mock RobotRepository robotRepository;

    @InjectMocks UserStatsService userStatsService;

    // -------------------------------------------------------------------------
    // updateAfterBattle()
    // -------------------------------------------------------------------------

    @Test
    void updateAfterBattle_win_incrementsWinsAndStreak() {
        Battle battle = buildBattle("A");
        UserStats stats = buildEmptyStats(battle.getOwner());
        given(userStatsRepository.findByUser(battle.getOwner())).willReturn(Optional.of(stats));
        given(battleRepository.findByOwner(battle.getOwner())).willReturn(List.of());

        userStatsService.updateAfterBattle(battle);

        ArgumentCaptor<UserStats> captor = ArgumentCaptor.forClass(UserStats.class);
        verify(userStatsRepository).save(captor.capture());
        UserStats saved = captor.getValue();
        assertEquals(1, saved.getWins());
        assertEquals(0, saved.getLosses());
        assertEquals(0, saved.getDraws());
        assertEquals(1, saved.getCurrentStreak());
        assertEquals(1, saved.getTotalBattles());
    }

    @Test
    void updateAfterBattle_loss_incrementsLossesAndResetsStreak() {
        Battle battle = buildBattle("B");
        UserStats stats = buildStatsWithStreak(3, battle.getOwner());
        given(userStatsRepository.findByUser(battle.getOwner())).willReturn(Optional.of(stats));
        given(battleRepository.findByOwner(battle.getOwner())).willReturn(List.of());

        userStatsService.updateAfterBattle(battle);

        ArgumentCaptor<UserStats> captor = ArgumentCaptor.forClass(UserStats.class);
        verify(userStatsRepository).save(captor.capture());
        UserStats saved = captor.getValue();
        assertEquals(1, saved.getLosses());
        assertEquals(0, saved.getCurrentStreak());
        assertEquals(3, saved.getBestStreak()); // best streak preserved on loss
    }

    @Test
    void updateAfterBattle_draw_incrementsDrawsAndResetsStreak() {
        Battle battle = buildBattle("DRAW");
        UserStats stats = buildStatsWithStreak(2, battle.getOwner());
        given(userStatsRepository.findByUser(battle.getOwner())).willReturn(Optional.of(stats));
        given(battleRepository.findByOwner(battle.getOwner())).willReturn(List.of());

        userStatsService.updateAfterBattle(battle);

        ArgumentCaptor<UserStats> captor = ArgumentCaptor.forClass(UserStats.class);
        verify(userStatsRepository).save(captor.capture());
        UserStats saved = captor.getValue();
        assertEquals(1, saved.getDraws());
        assertEquals(0, saved.getCurrentStreak());
    }

    @Test
    void updateAfterBattle_consecutiveWins_updatesBestStreak() {
        // currentStreak=4, bestStreak=4 — a win pushes both to 5
        Battle battle = buildBattle("A");
        UserStats stats = buildStatsWithStreak(4, battle.getOwner());
        given(userStatsRepository.findByUser(battle.getOwner())).willReturn(Optional.of(stats));
        given(battleRepository.findByOwner(battle.getOwner())).willReturn(List.of());

        userStatsService.updateAfterBattle(battle);

        ArgumentCaptor<UserStats> captor = ArgumentCaptor.forClass(UserStats.class);
        verify(userStatsRepository).save(captor.capture());
        UserStats saved = captor.getValue();
        assertEquals(5, saved.getCurrentStreak());
        assertEquals(5, saved.getBestStreak());
    }

    @Test
    void updateAfterBattle_winBelowBestStreak_doesNotOverwriteBestStreak() {
        // currentStreak=2, bestStreak=10 — a win makes currentStreak=3, bestStreak stays 10
        Battle battle = buildBattle("A");
        UserStats stats = buildEmptyStats(battle.getOwner());
        stats.setCurrentStreak(2);
        stats.setBestStreak(10);
        given(userStatsRepository.findByUser(battle.getOwner())).willReturn(Optional.of(stats));
        given(battleRepository.findByOwner(battle.getOwner())).willReturn(List.of());

        userStatsService.updateAfterBattle(battle);

        ArgumentCaptor<UserStats> captor = ArgumentCaptor.forClass(UserStats.class);
        verify(userStatsRepository).save(captor.capture());
        UserStats saved = captor.getValue();
        assertEquals(10, saved.getBestStreak()); // unchanged
        assertEquals(3, saved.getCurrentStreak());
    }

    @Test
    void updateAfterBattle_noOwner_doesNothing() {
        Battle battle = new Battle();
        battle.setOwner(null);

        userStatsService.updateAfterBattle(battle);

        verify(userStatsRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // getOrCreate()
    // -------------------------------------------------------------------------

    @Test
    void getOrCreate_noExistingStats_createsNewRow() {
        User user = buildUser(1L);
        given(userStatsRepository.findByUser(user)).willReturn(Optional.empty());
        given(userStatsRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        UserStats result = userStatsService.getOrCreate(user);

        verify(userStatsRepository).save(any(UserStats.class));
        assertEquals(0, result.getWins());
        assertEquals(0, result.getTotalBattles());
    }

    @Test
    void getOrCreate_existingStats_returnsExistingWithoutSaving() {
        User user = buildUser(1L);
        UserStats existing = buildEmptyStats(user);
        existing.setWins(5);
        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(existing));

        UserStats result = userStatsService.getOrCreate(user);

        assertEquals(5, result.getWins());
        verify(userStatsRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // toDto() — package-private, callable from same package
    // -------------------------------------------------------------------------

    @Test
    void toDto_winRate_calculatedCorrectly() {
        UserStats stats = new UserStats();
        stats.setWins(7);
        stats.setLosses(2);
        stats.setDraws(1);
        stats.setTotalBattles(10);
        // favoriteRobotId is null by default → no robotRepository call needed

        UserStatsDto dto = userStatsService.toDto(stats);

        assertEquals(70.0, dto.getWinRate(), 0.01);
        assertEquals(7, dto.getWins());
        assertEquals(2, dto.getLosses());
        assertEquals(10, dto.getTotalBattles());
    }

    @Test
    void toDto_zeroBattles_winRateIsZero() {
        UserStats stats = new UserStats();
        stats.setTotalBattles(0);

        UserStatsDto dto = userStatsService.toDto(stats);

        assertEquals(0.0, dto.getWinRate(), 0.001);
    }

    @Test
    void toDto_winRateRoundedToOneDecimal() {
        // 1 win / 3 battles = 33.333... → rounds to 33.3
        UserStats stats = new UserStats();
        stats.setWins(1);
        stats.setTotalBattles(3);

        UserStatsDto dto = userStatsService.toDto(stats);

        assertEquals(33.3, dto.getWinRate(), 0.01);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User buildUser(Long id) {
        return User.builder()
                .id(id)
                .username("u" + id)
                .email("u" + id + "@test.com")
                .provider("local")
                .build();
    }

    private Battle buildBattle(String winnerId) {
        User owner = buildUser(1L);
        Battle b = new Battle();
        b.setOwner(owner);
        b.setWinnerId(winnerId);
        b.setTotalTurns(5);
        b.setRobotAId(1L);
        b.setRobotBId(2L);
        Script sA = new Script(); sA.setId(10L);
        Script sB = new Script(); sB.setId(11L);
        b.setScriptA(sA);
        b.setScriptB(sB);
        return b;
    }

    private UserStats buildEmptyStats(User user) {
        UserStats s = new UserStats();
        s.setUser(user);
        return s;
    }

    private UserStats buildStatsWithStreak(int streak, User user) {
        UserStats s = buildEmptyStats(user);
        s.setCurrentStreak(streak);
        s.setBestStreak(streak);
        return s;
    }
}
