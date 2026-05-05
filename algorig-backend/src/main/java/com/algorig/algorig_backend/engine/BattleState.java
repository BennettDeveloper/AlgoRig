package com.algorig.algorig_backend.engine;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleState {

    private ExecutionFrame frameA;
    private ExecutionFrame frameB;
    private int currentTurn;
    private List<BattleLogEntry> log;
    private String winnerId;
}
