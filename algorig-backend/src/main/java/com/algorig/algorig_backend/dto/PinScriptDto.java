package com.algorig.algorig_backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinScriptDto {

    private Long id;
    private String name;
    private Integer featuredOrder;
}
