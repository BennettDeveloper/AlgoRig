package com.algorig.algorig_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptSummaryDto {

    private Long id;
    private String name;
    private String contentPreview;
    private int version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long ownerId;
    private String ownerUsername;
    private String ownerAvatarUrl;
    @JsonProperty("isPublic")
    private boolean isPublic;
    private ScriptStatsDto stats;
    private List<Long> requiredRobotIds;
    private boolean hasRequirements;
}
