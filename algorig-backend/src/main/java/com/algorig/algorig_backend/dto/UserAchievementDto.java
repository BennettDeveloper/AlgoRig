package com.algorig.algorig_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAchievementDto {

    private String code;
    private String displayName;
    private String description;
    private String icon;
    private LocalDateTime awardedAt;
    private Long battleId;
}
