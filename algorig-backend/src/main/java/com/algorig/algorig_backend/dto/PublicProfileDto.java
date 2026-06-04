package com.algorig.algorig_backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicProfileDto {

    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    private String tagline;
    private String provider;
    private LocalDateTime createdAt;
    private UserStatsDto stats;
    private List<UserAchievementDto> achievements;
    private List<FeaturedScriptDto> featuredScripts;
}
