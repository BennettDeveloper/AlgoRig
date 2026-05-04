package com.algorig.algorig_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

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
}
