package com.algorig.algorig_backend.engine;

import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleLogEntry {

    private int turn;
    private String actor;

    @Builder.Default
    private String entryType = "ACTION";

    private String conditionChecked;

    @Builder.Default
    private boolean conditionResult = false;

    @Builder.Default
    private boolean hasElseBranch = false;

    private Action actionTaken;
    private boolean stalledDueToInsufficientBattery;
    private int damageDealt;
    private int healingDone;
    private int batterySpent;
    private int attackerHpAfter;
    private int defenderHpAfter;
    private int attackerBatteryAfter;
    private String description;

    @Builder.Default
    private int scanTurnsRemaining = 0;
    @Builder.Default
    private List<String> debuffsRemoved = new ArrayList<>();

    // REPEAT log fields
    @Builder.Default
    private int repeatIteration = 0;
    @Builder.Default
    private int repeatTotal = 0;

    // MEMORY_SET log fields
    private String memoryVarName;
    @Builder.Default
    private int memoryVarOldValue = 0;
    @Builder.Default
    private int memoryVarNewValue = 0;

    // Passive ability fields
    private String passiveTriggered;
    private String passiveEffect;

    // Battery equalization fields
    @Builder.Default
    private int batteryEqualized = 0;
    @Builder.Default
    private int defenderBatteryAfter = 0;

    @Builder.Default
    private boolean stalledDueToOverload = false;
}
