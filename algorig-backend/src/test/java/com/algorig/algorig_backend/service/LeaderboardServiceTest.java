package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.LeaderboardEntryDto;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptStatsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock ScriptStatsRepository scriptStatsRepository;
    @Mock RobotRepository robotRepository;

    @InjectMocks LeaderboardService leaderboardService;

    // -------------------------------------------------------------------------
    // getByTotalWins
    // -------------------------------------------------------------------------

    @Test
    void getByTotalWins_returnsSortedByWinsDesc() {
        Pageable pageable = PageRequest.of(0, 50);
        List<Object[]> rows = rows(
                row(1L, "alice", null, 10L, 20L, 10, 5, 2, 3, null),
                row(2L, "bob", null, 5L, 10L, 5, 3, 1, 1, null));
        given(scriptStatsRepository.findLeaderboardByTotalWins(pageable))
                .willReturn(new PageImpl<>(rows, pageable, 2));

        Page<LeaderboardEntryDto> result = leaderboardService.getByTotalWins(pageable);

        assertEquals(2, result.getContent().size());
        assertEquals(1, result.getContent().get(0).getRank());
        assertEquals("alice", result.getContent().get(0).getUsername());
        assertEquals(10L, result.getContent().get(0).getTotalPublicScriptWins());
        assertEquals(2, result.getContent().get(1).getRank());
        assertEquals("bob", result.getContent().get(1).getUsername());
        verify(scriptStatsRepository).findLeaderboardByTotalWins(pageable);
    }

    // -------------------------------------------------------------------------
    // getByWinRate
    // -------------------------------------------------------------------------

    @Test
    void getByWinRate_callsWinRateQueryAndExcludesLowBattleUsers() {
        Pageable pageable = PageRequest.of(0, 50);
        List<Object[]> rows = rows(row(3L, "charlie", null, 8L, 12L, 8, 3, 1, 2, null));
        given(scriptStatsRepository.findLeaderboardByWinRate(pageable))
                .willReturn(new PageImpl<>(rows, pageable, 1));

        Page<LeaderboardEntryDto> result = leaderboardService.getByWinRate(pageable);

        assertEquals(1, result.getContent().size());
        assertEquals("charlie", result.getContent().get(0).getUsername());
        verify(scriptStatsRepository).findLeaderboardByWinRate(pageable);
    }

    // -------------------------------------------------------------------------
    // getByBestStreak
    // -------------------------------------------------------------------------

    @Test
    void getByBestStreak_sortsByBestStreakDesc() {
        Pageable pageable = PageRequest.of(0, 50);
        List<Object[]> rows = rows(
                row(4L, "dave", null, 20L, 40L, 20, 10, 5, 15, null),
                row(5L, "eve", null, 15L, 30L, 15, 8, 3, 8, null));
        given(scriptStatsRepository.findLeaderboardByBestStreak(pageable))
                .willReturn(new PageImpl<>(rows, pageable, 2));

        Page<LeaderboardEntryDto> result = leaderboardService.getByBestStreak(pageable);

        assertEquals(2, result.getContent().size());
        assertEquals(15, result.getContent().get(0).getBestStreak());
        assertEquals(8, result.getContent().get(1).getBestStreak());
        verify(scriptStatsRepository).findLeaderboardByBestStreak(pageable);
    }

    // -------------------------------------------------------------------------
    // Rank computation
    // -------------------------------------------------------------------------

    @Test
    void rankComputation_page1StartsAt51() {
        Pageable page1 = PageRequest.of(1, 50);
        List<Object[]> rows = rows(row(6L, "frank", null, 5L, 10L, 5, 2, 1, 1, null));
        given(scriptStatsRepository.findLeaderboardByTotalWins(page1))
                .willReturn(new PageImpl<>(rows, page1, 51));

        Page<LeaderboardEntryDto> result = leaderboardService.getByTotalWins(page1);

        assertEquals(51, result.getContent().get(0).getRank());
    }

    // -------------------------------------------------------------------------
    // favoriteRobotName
    // -------------------------------------------------------------------------

    @Test
    void favoriteRobotName_isNull_whenNoFavoriteRobotSet() {
        Pageable pageable = PageRequest.of(0, 50);
        List<Object[]> rows = rows(row(7L, "grace", null, 3L, 5L, 3, 1, 0, 2, null));
        given(scriptStatsRepository.findLeaderboardByTotalWins(pageable))
                .willReturn(new PageImpl<>(rows, pageable, 1));

        Page<LeaderboardEntryDto> result = leaderboardService.getByTotalWins(pageable);

        assertNull(result.getContent().get(0).getFavoriteRobotName());
    }

    @Test
    void favoriteRobotName_isResolvedFromRobotRepository() {
        Pageable pageable = PageRequest.of(0, 50);
        List<Object[]> rows = rows(row(8L, "henry", null, 5L, 10L, 5, 2, 1, 3, 99L));
        Robot robot = Robot.builder().id(99L).name("Ironclad").build();
        given(scriptStatsRepository.findLeaderboardByTotalWins(pageable))
                .willReturn(new PageImpl<>(rows, pageable, 1));
        given(robotRepository.findById(99L)).willReturn(Optional.of(robot));

        Page<LeaderboardEntryDto> result = leaderboardService.getByTotalWins(pageable);

        assertEquals("Ironclad", result.getContent().get(0).getFavoriteRobotName());
    }

    // -------------------------------------------------------------------------
    // publicWinRate
    // -------------------------------------------------------------------------

    @Test
    void publicWinRate_isZero_whenTotalBattlesIsZero() {
        Pageable pageable = PageRequest.of(0, 50);
        List<Object[]> rows = rows(row(9L, "iris", null, 0L, 0L, 0, 0, 0, 0, null));
        given(scriptStatsRepository.findLeaderboardByTotalWins(pageable))
                .willReturn(new PageImpl<>(rows, pageable, 1));

        Page<LeaderboardEntryDto> result = leaderboardService.getByTotalWins(pageable);

        assertEquals(0.0, result.getContent().get(0).getPublicWinRate(), 0.0001);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Object[] row(Long userId, String username, String avatarUrl,
                         Long wins, Long battles,
                         int uWins, int uLosses, int uDraws, int bestStreak,
                         Long favoriteRobotId) {
        return new Object[]{userId, username, avatarUrl,
                wins, battles, uWins, uLosses, uDraws, bestStreak, favoriteRobotId};
    }

    private List<Object[]> rows(Object[]... entries) {
        return Arrays.asList(entries);
    }
}
