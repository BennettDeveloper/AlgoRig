package com.algorig.algorig_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptDto {

    private Long id;
    private String name;
    private String content;
    private int version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long ownerId;
    private String ownerUsername;
    @JsonProperty("isPublic")
    private boolean isPublic;
    private Integer featuredOrder;
    private List<Long> requiredRobotIds;
    private boolean hasRequirements;
}
