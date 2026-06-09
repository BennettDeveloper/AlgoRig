package com.algorig.algorig_backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ScriptSaveRequestDto {

    private String name;
    private String content;
    private List<String> requiredTiers;
}
