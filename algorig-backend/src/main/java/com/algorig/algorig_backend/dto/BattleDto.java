package com.algorig.algorig_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BattleDto {

    private Long id;
    private Long robotAId;
    private Long robotBId;
    private Long scriptAId;
    private Long scriptBId;
    private String winnerId;
    private int totalTurns;
    private String battleLog;
    private LocalDateTime foughtAt;
    private RobotDto robotA;
    private RobotDto robotB;
    private Long ownerId;
    private String ownerUsername;
    private String ownerAvatarUrl;
    @JsonProperty("isPublic")
    private boolean isPublic;
    @Builder.Default
    private List<UserAchievementDto> newAchievements = new ArrayList<>();
}
