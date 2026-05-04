package com.algorig.algorig_backend.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptValidationResultDto {

    private boolean valid;
    private List<String> errors;
}
