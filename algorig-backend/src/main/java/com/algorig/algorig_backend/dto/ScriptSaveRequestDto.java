package com.algorig.algorig_backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScriptSaveRequestDto {

    private String name;
    private String content;
}
