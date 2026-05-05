package com.algorig.algorig_backend.engine;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleLogEntry {

    private int turn;
    private String actor;
    private Action actionTaken;
    private boolean stalledDueToInsufficientBattery;
    private int damageDealt;
    private int healingDone;
    private int batterySpent;
    private int attackerHpAfter;
    private int defenderHpAfter;
    private int attackerBatteryAfter;
    private String description;
}
