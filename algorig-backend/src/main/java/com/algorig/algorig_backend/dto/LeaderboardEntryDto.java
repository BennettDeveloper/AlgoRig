package com.algorig.algorig_backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class LeaderboardEntryDto {

    private int rank;
    private String username;
    private String avatarUrl;
    private long totalPublicScriptWins;
    private long totalPublicScriptBattles;
    private double publicWinRate;
    private int bestStreak;
    private int wins;
    private int losses;
    private int draws;
    private String favoriteRobotName;
}
