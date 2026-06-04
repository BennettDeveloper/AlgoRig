package com.algorig.algorig_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptStatsDto {

    private int wins;
    private int losses;
    private int draws;
    private int totalBattles;
    private int timesUsed;
    private double winRate;
    private String difficultyLabel;
    private LocalDateTime lastBattledAt;
}
