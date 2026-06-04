package com.algorig.algorig_backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatsDto {

    private int wins;
    private int losses;
    private int draws;
    private int totalBattles;
    private int currentStreak;
    private int bestStreak;
    private long totalTurnsPlayed;
    private double winRate;
    private String favoriteRobotName;
}
