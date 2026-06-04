package com.algorig.algorig_backend.engine;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RobotBattleState {

    private int hp;
    private int battery;
    private int heat;
    private int firewall;
    private int armor;
    private int stability;
    private Action lastAction;

    @Builder.Default
    private boolean scanning = false;
    @Builder.Default
    private int scanTurnsRemaining = 0;
    @Builder.Default
    private int scanTurnsTotal = 0;

    @Builder.Default
    private PassiveState passiveState = new PassiveState();
}
