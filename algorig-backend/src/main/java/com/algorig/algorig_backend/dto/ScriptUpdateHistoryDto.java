package com.algorig.algorig_backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptUpdateHistoryDto {

    private Long id;
    private int version;
    private LocalDateTime savedAt;
}
