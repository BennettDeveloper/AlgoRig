package com.algorig.algorig_backend.service;

import com.algorig.algorig_backend.dto.LeaderboardEntryDto;
import com.algorig.algorig_backend.repository.RobotRepository;
import com.algorig.algorig_backend.repository.ScriptStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final ScriptStatsRepository scriptStatsRepository;
    private final RobotRepository robotRepository;

    @Transactional(readOnly = true)
    public Page<LeaderboardEntryDto> getByTotalWins(Pageable pageable) {
        Page<Object[]> raw = scriptStatsRepository.findLeaderboardByTotalWins(pageable);
        return mapPage(raw, pageable);
    }

    @Transactional(readOnly = true)
    public Page<LeaderboardEntryDto> getByWinRate(Pageable pageable) {
        Page<Object[]> raw = scriptStatsRepository.findLeaderboardByWinRate(pageable);
        return mapPage(raw, pageable);
    }

    @Transactional(readOnly = true)
    public Page<LeaderboardEntryDto> getByBestStreak(Pageable pageable) {
        Page<Object[]> raw = scriptStatsRepository.findLeaderboardByBestStreak(pageable);
        return mapPage(raw, pageable);
    }

    private Page<LeaderboardEntryDto> mapPage(Page<Object[]> raw, Pageable pageable) {
        int offset = pageable.getPageNumber() * pageable.getPageSize();
        List<Object[]> rows = raw.getContent();
        List<LeaderboardEntryDto> dtos = new ArrayList<>(rows.size());
        for (int i = 0; i < rows.size(); i++) {
            dtos.add(mapRow(rows.get(i), offset + i + 1));
        }
        return new PageImpl<>(dtos, pageable, raw.getTotalElements());
    }

    private LeaderboardEntryDto mapRow(Object[] row, int rank) {
        long scriptWins = ((Number) row[3]).longValue();
        long scriptBattles = ((Number) row[4]).longValue();
        double publicWinRate = scriptBattles == 0 ? 0.0 : (double) scriptWins / scriptBattles;

        int userWins = row[5] != null ? ((Number) row[5]).intValue() : 0;
        int userLosses = row[6] != null ? ((Number) row[6]).intValue() : 0;
        int userDraws = row[7] != null ? ((Number) row[7]).intValue() : 0;
        int bestStreak = row[8] != null ? ((Number) row[8]).intValue() : 0;

        Long favoriteRobotId = row[9] != null ? ((Number) row[9]).longValue() : null;
        String favoriteRobotName = favoriteRobotId != null
                ? robotRepository.findById(favoriteRobotId).map(r -> r.getName()).orElse(null)
                : null;

        return LeaderboardEntryDto.builder()
                .rank(rank)
                .username((String) row[1])
                .avatarUrl((String) row[2])
                .totalPublicScriptWins(scriptWins)
                .totalPublicScriptBattles(scriptBattles)
                .publicWinRate(publicWinRate)
                .bestStreak(bestStreak)
                .wins(userWins)
                .losses(userLosses)
                .draws(userDraws)
                .favoriteRobotName(favoriteRobotName)
                .build();
    }
}
