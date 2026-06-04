package com.algorig.algorig_backend.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScriptSaveRequestDto {

    private String name;
    private String content;
    private List<Long> requiredRobotIds;
}