package com.algorig.algorig_backend.engine;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionResult {

    private Action actionTaken;
    private boolean stalledDueToInsufficientBattery;
    private int damageDealt;
    private int healingDone;
    private int batterySpent;
    private String description;

    @Builder.Default
    private int scanDuration = 0;

    @Builder.Default
    private int batteryEqualized = 0;

    @Builder.Default
    private boolean stalledDueToOverload = false;
}
