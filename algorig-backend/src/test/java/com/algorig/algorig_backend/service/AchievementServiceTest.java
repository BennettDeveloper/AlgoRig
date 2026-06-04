package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.UserAchievement;
import com.algorig.algorig_backend.model.entity.UserStats;
import com.algorig.algorig_backend.model.enums.AchievementType;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.repository.UserAchievementRepository;
import com.algorig.algorig_backend.repository.UserStatsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class AchievementServiceTest {

    @Mock UserAchievementRepository userAchievementRepository;
    @Mock UserStatsRepository userStatsRepository;
    @Mock ScriptRepository scriptRepository;
    @Mock BattleRepository battleRepository;
    @Mock RobotRepository robotRepository;

    @InjectMocks AchievementService achievementService;

    // -------------------------------------------------------------------------
    // Edge cases — early return paths
    // -------------------------------------------------------------------------

    @Test
    void checkAndAward_nullOwner_returnsEmptyList() {
        Battle battle = new Battle();
        battle.setOwner(null);

        List<UserAchievement> result = achievementService.checkAndAward(battle);

        assertTrue(result.isEmpty());
        verify(userAchievementRepository, never()).save(any());
    }

    @Test
    void checkAndAward_noUserStats_returnsEmptyList() {
        // checkAndAward returns early when UserStats row doesn't exist yet
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "A");
        given(userStatsRepository.findByUser(user)).willReturn(Optional.empty());

        List<UserAchievement> result = achievementService.checkAndAward(battle);

        assertTrue(result.isEmpty());
        verify(userAchievementRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // FIRST_BLOOD
    // -------------------------------------------------------------------------

    @Test
    void checkAndAward_firstBlood_awardedOnFirstWin() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "A");
        UserStats stats = statsWithWins(1);

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        // Nothing already earned
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        // SCRIPTER: 0 scripts → not earned
        given(scriptRepository.countByOwner(user)).willReturn(0L);
        // APEX_CHALLENGER / VARIETY_PACK: no battles → neither earned
        given(battleRepository.findByOwner(user)).willReturn(List.of());
        given(userAchievementRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().anyMatch(a ->
                a.getAchievementType() == AchievementType.FIRST_BLOOD),
                "FIRST_BLOOD must be awarded on first win");
    }

    @Test
    void checkAndAward_firstBlood_notAwardedWhenAlreadyEarned() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "A");
        UserStats stats = statsWithWins(5);

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        // FIRST_BLOOD already in the earned set
        UserAchievement existing = new UserAchievement();
        existing.setAchievementType(AchievementType.FIRST_BLOOD);
        given(userAchievementRepository.findByUser(user)).willReturn(List.of(existing));
        given(scriptRepository.countByOwner(user)).willReturn(0L);
        given(battleRepository.findByOwner(user)).willReturn(List.of());

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().noneMatch(a ->
                a.getAchievementType() == AchievementType.FIRST_BLOOD),
                "Already-earned FIRST_BLOOD must not be re-awarded");
    }

    @Test
    void checkAndAward_firstBlood_notAwardedWithZeroWins() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "B"); // loss
        UserStats stats = statsWithWins(0); // still 0 wins

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(0L);
        given(battleRepository.findByOwner(user)).willReturn(List.of());

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().noneMatch(a ->
                a.getAchievementType() == AchievementType.FIRST_BLOOD));
    }

    // -------------------------------------------------------------------------
    // SCRIPTER
    // -------------------------------------------------------------------------

    @Test
    void checkAndAward_scripter_awardedAtExactlyThreeScripts() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "DRAW");
        UserStats stats = new UserStats();

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(3L);
        given(battleRepository.findByOwner(user)).willReturn(List.of());
        given(userAchievementRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().anyMatch(a ->
                a.getAchievementType() == AchievementType.SCRIPTER));
    }

    @Test
    void checkAndAward_scripter_notAwardedAtTwoScripts() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "DRAW");
        UserStats stats = new UserStats();

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(2L);
        given(battleRepository.findByOwner(user)).willReturn(List.of());

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().noneMatch(a ->
                a.getAchievementType() == AchievementType.SCRIPTER));
    }

    // -------------------------------------------------------------------------
    // VETERAN
    // -------------------------------------------------------------------------

    @Test
    void checkAndAward_veteran_awardedAtExactly25Battles() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "A");
        UserStats stats = new UserStats();
        stats.setTotalBattles(25);
        stats.setWins(1); // enough for FIRST_BLOOD too — both may be awarded

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(0L);
        given(battleRepository.findByOwner(user)).willReturn(List.of());
        given(userAchievementRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().anyMatch(a ->
                a.getAchievementType() == AchievementType.VETERAN));
    }

    @Test
    void checkAndAward_veteran_notAwardedAt24Battles() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "DRAW");
        UserStats stats = new UserStats();
        stats.setTotalBattles(24);

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(0L);
        given(battleRepository.findByOwner(user)).willReturn(List.of());

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().noneMatch(a ->
                a.getAchievementType() == AchievementType.VETERAN));
    }

    // -------------------------------------------------------------------------
    // DOMINATOR
    // -------------------------------------------------------------------------

    @Test
    void checkAndAward_dominator_awardedAtBestStreak5() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "A");
        UserStats stats = new UserStats();
        stats.setBestStreak(5);
        stats.setWins(1);

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(0L);
        given(battleRepository.findByOwner(user)).willReturn(List.of());
        given(userAchievementRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().anyMatch(a ->
                a.getAchievementType() == AchievementType.DOMINATOR));
    }

    @Test
    void checkAndAward_dominator_notAwardedAtBestStreak4() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "DRAW");
        UserStats stats = new UserStats();
        stats.setBestStreak(4);

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(0L);
        given(battleRepository.findByOwner(user)).willReturn(List.of());

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().noneMatch(a ->
                a.getAchievementType() == AchievementType.DOMINATOR));
    }

    // -------------------------------------------------------------------------
    // VARIETY_PACK
    // -------------------------------------------------------------------------

    @Test
    void checkAndAward_varietyPack_awardedWith5DistinctRobots() {
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "A");
        UserStats stats = new UserStats();
        stats.setWins(1);

        // 5 battles each with different robots → 5 distinct robot IDs
        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(0L);
        given(battleRepository.findByOwner(user)).willReturn(buildBattlesWithDistinctRobots(5));
        given(userAchievementRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().anyMatch(a ->
                a.getAchievementType() == AchievementType.VARIETY_PACK));
    }

    // -------------------------------------------------------------------------
    // Multi-achievement in one battle
    // -------------------------------------------------------------------------

    @Test
    void checkAndAward_multipleAchievements_canBeAwardedSimultaneously() {
        // User qualifies for FIRST_BLOOD (1 win) and SCRIPTER (3 scripts) in the same battle
        User user = buildUser(1L);
        Battle battle = buildBattle(user, "A");
        UserStats stats = statsWithWins(1);

        given(userStatsRepository.findByUser(user)).willReturn(Optional.of(stats));
        given(userAchievementRepository.findByUser(user)).willReturn(List.of());
        given(scriptRepository.countByOwner(user)).willReturn(3L); // SCRIPTER threshold
        given(battleRepository.findByOwner(user)).willReturn(List.of());
        given(userAchievementRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        List<UserAchievement> awarded = achievementService.checkAndAward(battle);

        assertTrue(awarded.stream().anyMatch(a ->
                a.getAchievementType() == AchievementType.FIRST_BLOOD));
        assertTrue(awarded.stream().anyMatch(a ->
                a.getAchievementType() == AchievementType.SCRIPTER));
        assertTrue(awarded.size() >= 2,
                "Both FIRST_BLOOD and SCRIPTER must be awarded; got: " + awarded.size());
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

    private Battle buildBattle(User owner, String winnerId) {
        Battle b = new Battle();
        b.setOwner(owner);
        b.setWinnerId(winnerId);
        b.setRobotAId(1L);
        b.setRobotBId(2L);
        return b;
    }

    private UserStats statsWithWins(int wins) {
        UserStats s = new UserStats();
        s.setWins(wins);
        return s;
    }

    private List<Battle> buildBattlesWithDistinctRobots(int count) {
        // Each battle uses a different pair of robot IDs, giving count*2 unique IDs (≥5)
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> {
                    Battle b = new Battle();
                    b.setRobotAId((long) (i * 2 + 1));
                    b.setRobotBId((long) (i * 2 + 2));
                    return b;
                })
                .toList();
    }
}
