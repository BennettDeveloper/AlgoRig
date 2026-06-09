package com.algorig.algorig_backend.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

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
    private List<Integer> allowedTiers = new ArrayList<>(List.of(1, 2, 3, 4, 5));

    @Builder.Default
    private int maxTurns = 200;

    /** "PRESET" (default) or "CUSTOM" — determines which robot source to use for slot A. */
    @Builder.Default
    private String userRobotType = "PRESET";

    /** "PRESET" (default) or "CUSTOM" — determines which robot source to use for slot B. */
    @Builder.Default
    private String enemyRobotType = "PRESET";

    /** ID of the custom robot to use for slot A; required when userRobotType = "CUSTOM". */
    private Long userCustomRobotId;

    /** ID of the custom robot to use for slot B; required when enemyRobotType = "CUSTOM". */
    private Long enemyCustomRobotId;
}