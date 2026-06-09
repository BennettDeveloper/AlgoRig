package com.algorig.algorig_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptDetailDto {

    private Long id;
    private String name;
    private String content;
    private int version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long ownerId;
    private String ownerUsername;
    private String ownerAvatarUrl;
    @JsonProperty("isPublic")
    private boolean isPublic;
    private ScriptStatsDto stats;
    private List<ScriptUpdateHistoryDto> versionHistory;
    private List<String> requiredTiers;
}
