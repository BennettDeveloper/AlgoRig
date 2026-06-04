package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.UserAchievementDto;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.UserAchievement;
import com.algorig.algorig_backend.model.entity.UserStats;
import com.algorig.algorig_backend.model.enums.AchievementType;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptRepository;
import com.algorig.algorig_backend.repository.UserAchievementRepository;
import com.algorig.algorig_backend.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AchievementService {

    private final UserAchievementRepository userAchievementRepository;
    private final UserStatsRepository userStatsRepository;
    private final ScriptRepository scriptRepository;
    private final BattleRepository battleRepository;
    private final RobotRepository robotRepository;

    public List<UserAchievement> checkAndAward(Battle battle) {
        User user = battle.getOwner();
        if (user == null) return List.of();

        UserStats stats = userStatsRepository.findByUser(user).orElse(null);
        if (stats == null) return List.of();

        Set<AchievementType> alreadyEarned = userAchievementRepository.findByUser(user)
                .stream()
                .map(UserAchievement::getAchievementType)
                .collect(Collectors.toSet());

        // Lazy-load all battles only if needed for APEX_CHALLENGER or VARIETY_PACK
        List<Battle> allBattles = null;

        List<UserAchievement> newlyAwarded = new ArrayList<>();

        for (AchievementType type : AchievementType.values()) {
            if (alreadyEarned.contains(type)) continue;

            boolean earned = switch (type) {
                case FIRST_BLOOD -> stats.getWins() >= 1;
                case SCRIPTER    -> scriptRepository.countByOwner(user) >= 3;
                case VETERAN     -> stats.getTotalBattles() >= 25;
                case DOMINATOR   -> stats.getBestStreak() >= 5;
                case APEX_CHALLENGER -> {
                    if (allBattles == null) allBattles = battleRepository.findByOwner(user);
                    Set<Long> robotIds = collectRobotIds(allBattles);
                    yield robotIds.stream().anyMatch(id -> robotRepository.findById(id)
                            .map(r -> r.getTier() == 5)
                            .orElse(false));
                }
                case VARIETY_PACK -> {
                    if (allBattles == null) allBattles = battleRepository.findByOwner(user);
                    yield collectRobotIds(allBattles).size() >= 5;
                }
            };

            if (earned) {
                newlyAwarded.add(award(user, type, battle.getId()));
            }
        }

        return newlyAwarded;
    }

    @Transactional(readOnly = true)
    public List<UserAchievementDto> getAchievementsForUser(User user) {
        return toDto(userAchievementRepository.findByUserOrderByAwardedAtDesc(user));
    }

    public List<UserAchievementDto> toDto(List<UserAchievement> achievements) {
        return achievements.stream()
                .map(a -> UserAchievementDto.builder()
                        .code(a.getAchievementType().name())
                        .displayName(a.getAchievementType().getDisplayName())
                        .description(a.getAchievementType().getDescription())
                        .icon(a.getAchievementType().getIcon())
                        .awardedAt(a.getAwardedAt())
                        .battleId(a.getBattleId())
                        .build())
                .toList();
    }

    private UserAchievement award(User user, AchievementType type, Long battleId) {
        UserAchievement achievement = UserAchievement.builder()
                .user(user)
                .achievementType(type)
                .battleId(battleId)
                .build();
        return userAchievementRepository.save(achievement);
    }

    private Set<Long> collectRobotIds(List<Battle> battles) {
        Set<Long> ids = new HashSet<>();
        for (Battle b : battles) {
            if (b.getRobotAId() != null) ids.add(b.getRobotAId());
            if (b.getRobotBId() != null) ids.add(b.getRobotBId());
        }
        return ids;
    }
}
