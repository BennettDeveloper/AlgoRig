package com.algorig.algorig_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeaturedScriptDto {

    private Long id;
    private String name;
    private String content;
    private int featuredOrder;
    private LocalDateTime updatedAt;
}
