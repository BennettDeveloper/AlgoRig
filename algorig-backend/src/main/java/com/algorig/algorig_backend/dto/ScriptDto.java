package com.algorig.algorig_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

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
}