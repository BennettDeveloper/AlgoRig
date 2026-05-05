package com.algorig.algorig_backend.engine;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleContext {

    private RobotBattleState myState;
    private RobotBattleState enemyState;
    private int turnNumber;
}
