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
    private Action lastAction;
}
