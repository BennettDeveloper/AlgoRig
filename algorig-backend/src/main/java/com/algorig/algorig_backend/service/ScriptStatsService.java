package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.ScriptStatsDto;
import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.ScriptStats;
import com.algorig.algorig_backend.repository.BattleRepository;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScriptStatsService {

    private final ScriptStatsRepository scriptStatsRepository;
    private final BattleRepository battleRepository;
    private final RobotRepository robotRepository;

    private record NormalizedStats(
        double tierNormalizedWinRate,
        int qualifyingBattles,
        int distinctContexts
    ) {}

    @Transactional
    public void resetStats(Script script, LocalDateTime since) {
        ScriptStats stats = getOrCreate(script);
        stats.setWins(0);
        stats.setLosses(0);
        stats.setDraws(0);
        stats.setTotalBattles(0);
        stats.setTimesUsed(0);
        stats.setWinRate(0.0);
        stats.setTierNormalizedWinRate(0.0);
        stats.setDistinctContexts(0);
        stats.setLastBattledAt(null);
        stats.setStatsSince(since);
        scriptStatsRepository.save(stats);
    }

    public ScriptStats getOrCreate(Script script) {
        return scriptStatsRepository.findByScript(script).orElseGet(() -> {
            ScriptStats stats = ScriptStats.builder().script(script).build();
            return scriptStatsRepository.save(stats);
        });
    }

    public void updateAfterBattle(Battle battle) {
        Script scriptA = battle.getScriptA();
        Script scriptB = battle.getScriptB();
        if (scriptA == null && scriptB == null) return;

        // Self-battle: count as one Draw rather than running A/B win-rate logic.
        // The DB re-count in updateScriptStats would double-count a self-battle row
        // (script appears in both slot A and slot B), so we use an incremental update
        // and return early instead.
        // Self-battle rebalancing requires a data migration — existing stats may show
        // inflated wins/losses for scripts used in self-battles before this fix.
        // Run a one-time DB correction if needed.
        boolean isSelfBattle = scriptA != null && scriptB != null
                && scriptA.getId().equals(scriptB.getId());
        if (isSelfBattle) {
            ScriptStats stats = getOrCreate(scriptA);
            stats.setTimesUsed(stats.getTimesUsed() + 1);
            stats.setTotalBattles(stats.getTotalBattles() + 1);
            stats.setDraws(stats.getDraws() + 1);
            stats.setWinRate(computeWinRate(stats.getWins(), stats.getTotalBattles()));
            stats.setLastBattledAt(battle.getFoughtAt());
            scriptStatsRepository.save(stats);
            return;
        }

        if (scriptA != null) {
            updateScriptStats(scriptA, battle);
        }

        // Only update scriptB if it's a different script from scriptA
        if (scriptB != null && (scriptA == null || !scriptA.getId().equals(scriptB.getId()))) {
            updateScriptStats(scriptB, battle);
        }
    }

    @Transactional(readOnly = true)
    public ScriptStatsDto getStatsDtoForScript(Script script) {
        return scriptStatsRepository.findByScript(script)
                .map(this::toDto)
                .orElseGet(this::getEmptyStats);
    }

    public ScriptStatsDto getEmptyStats() {
        return ScriptStatsDto.builder()
                .wins(0).losses(0).draws(0)
                .totalBattles(0).timesUsed(0)
                .winRate(0.0)
                .difficultyLabel("Unranked")
                .lastBattledAt(null)
                .build();
    }

    ScriptStatsDto toDto(ScriptStats stats) {
        double rounded = Math.round(stats.getWinRate() * 10.0) / 10.0;

        String difficultyLabel = computeDifficultyLabel(
                stats.getTierNormalizedWinRate(),
                stats.getTotalBattles(),
                stats.getDistinctContexts()
        );

        return ScriptStatsDto.builder()
                .wins(stats.getWins())
                .losses(stats.getLosses())
                .draws(stats.getDraws())
                .totalBattles(stats.getTotalBattles())
                .timesUsed(stats.getTimesUsed())
                .winRate(rounded)
                .difficultyLabel(difficultyLabel)
                .lastBattledAt(stats.getLastBattledAt())
                .build();
    }

    private void updateScriptStats(Script script, Battle battle) {
        ScriptStats stats = getOrCreate(script);

        long usageA = battleRepository.countByScriptA(script);
        long usageB = battleRepository.countByScriptB(script);
        int totalBattles = (int) (usageA + usageB);

        long winsAsA = battleRepository.countByScriptAAndWinnerId(script, "A");
        long winsAsB = battleRepository.countByScriptBAndWinnerId(script, "B");
        int totalWins = (int) (winsAsA + winsAsB);

        long lossesAsA = battleRepository.countByScriptAAndWinnerId(script, "B");
        long lossesAsB = battleRepository.countByScriptBAndWinnerId(script, "A");
        int totalLosses = (int) (lossesAsA + lossesAsB);

        int totalDraws = totalBattles - totalWins - totalLosses;

        stats.setTimesUsed(totalBattles);
        stats.setTotalBattles(totalBattles);
        stats.setWins(totalWins);
        stats.setLosses(totalLosses);
        stats.setDraws(totalDraws);
        stats.setWinRate(computeWinRate(totalWins, totalBattles));
        stats.setLastBattledAt(battle.getFoughtAt());

        // Compute tier-normalized difficulty stats (excludes self-battles)
        NormalizedStats normalized = computeNormalizedStats(script);
        stats.setTierNormalizedWinRate(normalized.tierNormalizedWinRate());
        stats.setDistinctContexts(normalized.distinctContexts());

        scriptStatsRepository.save(stats);
    }

    private NormalizedStats computeNormalizedStats(Script script) {
        ScriptStats existingStats = scriptStatsRepository.findByScript(script).orElse(null);

        List<Battle> battles;
        if (existingStats != null && existingStats.getStatsSince() != null) {
            battles = battleRepository.findNonSelfBattlesForScriptSince(
                    script, existingStats.getStatsSince());
        } else {
            battles = battleRepository.findNonSelfBattlesForScript(script);
        }

        if (battles.isEmpty()) {
            return new NormalizedStats(0.0, 0, 0);
        }

        // Batch-load all robot tiers needed
        Set<Long> robotIds = new HashSet<>();
        for (Battle b : battles) {
            if (b.getRobotAId() != null) robotIds.add(b.getRobotAId());
            if (b.getRobotBId() != null) robotIds.add(b.getRobotBId());
        }
        Map<Long, Integer> tierMap = robotRepository.findAllById(robotIds)
                .stream()
                .collect(Collectors.toMap(Robot::getId, Robot::getTier));

        double weightedWins  = 0.0;
        double weightedTotal = 0.0;
        Set<String> contextSet = new HashSet<>();

        for (Battle b : battles) {
            boolean scriptIsSlotA = b.getScriptA().getId().equals(script.getId());

            Long myRobotId         = scriptIsSlotA ? b.getRobotAId() : b.getRobotBId();
            Long challengerRobotId = scriptIsSlotA ? b.getRobotBId() : b.getRobotAId();
            Long challengerScriptId = scriptIsSlotA
                    ? b.getScriptB().getId()
                    : b.getScriptA().getId();
            Long opponentRobotId   = myRobotId;

            int myTier         = tierMap.getOrDefault(myRobotId, 1);
            int challengerTier = tierMap.getOrDefault(challengerRobotId, 1);
            double weight      = computeTierWeight(myTier, challengerTier);

            boolean won = (scriptIsSlotA  && "A".equals(b.getWinnerId()))
                       || (!scriptIsSlotA && "B".equals(b.getWinnerId()));

            weightedTotal += weight;
            if (won) weightedWins += weight;

            contextSet.add(challengerScriptId + "_" + challengerRobotId + "_" + opponentRobotId);
        }

        double normalizedRate = weightedTotal == 0 ? 0.0
                : Math.round((weightedWins / weightedTotal * 100.0) * 10.0) / 10.0;

        return new NormalizedStats(normalizedRate, battles.size(), contextSet.size());
    }

    private double computeTierWeight(int myTier, int opponentTier) {
        double gap    = opponentTier - myTier;
        double weight = 1.0 + (gap * 0.2);
        return Math.max(0.1, Math.min(2.0, weight));
    }

    private String computeDifficultyLabel(double tierNormalizedWinRate,
                                          int totalBattles,
                                          int distinctContexts) {
        if (totalBattles < 5 || distinctContexts < 3) return "Unranked";
        if (tierNormalizedWinRate <= 40.0) return "Beginner";
        if (tierNormalizedWinRate <= 60.0) return "Intermediate";
        if (tierNormalizedWinRate <= 80.0) return "Advanced";
        return "Elite";
    }

    private double computeWinRate(int wins, int totalBattles) {
        if (totalBattles == 0) return 0.0;
        return Math.round((wins * 100.0 / totalBattles) * 10.0) / 10.0;
    }
}
