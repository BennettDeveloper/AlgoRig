package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.UserStatsDto;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.UserStats;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class UserStatsService {

    private final UserStatsRepository userStatsRepository;
    private final BattleRepository battleRepository;
    private final RobotRepository robotRepository;

    public UserStats getOrCreate(User user) {
        return userStatsRepository.findByUser(user).orElseGet(() -> {
            UserStats stats = UserStats.builder().user(user).build();
            return userStatsRepository.save(stats);
        });
    }

    public void updateAfterBattle(Battle battle) {
        User owner = battle.getOwner();
        if (owner == null) return;

        UserStats stats = getOrCreate(owner);

        stats.setTotalBattles(stats.getTotalBattles() + 1);
        stats.setTotalTurnsPlayed(stats.getTotalTurnsPlayed() + battle.getTotalTurns());

        String result = battle.getWinnerId();
        if ("A".equals(result)) {
            stats.setWins(stats.getWins() + 1);
            int newStreak = stats.getCurrentStreak() + 1;
            stats.setCurrentStreak(newStreak);
            if (newStreak > stats.getBestStreak()) {
                stats.setBestStreak(newStreak);
            }
        } else if ("B".equals(result)) {
            stats.setLosses(stats.getLosses() + 1);
            stats.setCurrentStreak(0);
        } else {
            stats.setDraws(stats.getDraws() + 1);
            stats.setCurrentStreak(0);
        }

        // Recompute favorite robot from all battles
        List<Battle> allBattles = battleRepository.findByOwner(owner);
        Map<Long, Long> freq = new HashMap<>();
        for (Battle b : allBattles) {
            if (b.getRobotAId() != null) freq.merge(b.getRobotAId(), 1L, Long::sum);
            if (b.getRobotBId() != null) freq.merge(b.getRobotBId(), 1L, Long::sum);
        }
        freq.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .ifPresent(stats::setFavoriteRobotId);

        userStatsRepository.save(stats);
    }

    @Transactional(readOnly = true)
    public UserStatsDto getStatsDtoForUser(User user) {
        UserStats stats = getOrCreate(user);
        return toDto(stats);
    }

    UserStatsDto toDto(UserStats stats) {
        double winRate = stats.getTotalBattles() == 0
                ? 0.0
                : (stats.getWins() * 100.0) / stats.getTotalBattles();

        String favoriteRobotName = null;
        if (stats.getFavoriteRobotId() != null) {
            favoriteRobotName = robotRepository.findById(stats.getFavoriteRobotId())
                    .map(r -> r.getName())
                    .orElse(null);
        }

        return UserStatsDto.builder()
                .wins(stats.getWins())
                .losses(stats.getLosses())
                .draws(stats.getDraws())
                .totalBattles(stats.getTotalBattles())
                .currentStreak(stats.getCurrentStreak())
                .bestStreak(stats.getBestStreak())
                .totalTurnsPlayed(stats.getTotalTurnsPlayed())
                .winRate(Math.round(winRate * 10.0) / 10.0)
                .favoriteRobotName(favoriteRobotName)
                .build();
    }
}
