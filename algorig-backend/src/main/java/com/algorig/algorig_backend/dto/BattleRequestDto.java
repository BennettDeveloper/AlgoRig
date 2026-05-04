package com.algorig.algorig_backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BattleRequestDto {

    private Long robotAId;
    private Long robotBId;
    private Long scriptAId;
    private Long scriptBId;
    private int tierCap;
}
