package com.algorig.algorig_backend.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Data
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class BattleRequestDto {

    private Long robotAId;
    private Long robotBId;
    private Long scriptAId;
    private Long scriptBId;

    @Builder.Default
    private int tierCap = 5;

    @Builder.Default
    private int maxTurns = 200;
}