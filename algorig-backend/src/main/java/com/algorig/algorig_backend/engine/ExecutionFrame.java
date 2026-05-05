package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import com.algorig.algorig_backend.parser.ParsedScript;
import lombok.*;

import java.util.Deque;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionFrame {

    private Robot robot;
    private RobotBattleState state;
    private ParsedScript parsedScript;
    private int pointerIndex;

    /** Each int[] is {blockIndex, branchType, positionInBranch} where branchType 0=ifBranch, 1=elseBranch */
    private Deque<int[]> branchStack;

    private boolean inBranch;
}
