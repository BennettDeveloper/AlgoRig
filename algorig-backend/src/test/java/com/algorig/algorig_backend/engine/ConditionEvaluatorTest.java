package com.algorig.algorig_backend.engine;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ConditionEvaluatorTest {

    private ConditionEvaluator evaluator;
    private BattleContext context;

    @BeforeEach
    void setUp() {
        evaluator = new ConditionEvaluator();

        RobotBattleState myState = RobotBattleState.builder()
                .hp(30)
                .battery(60)
                .heat(10)
                .firewall(40)
                .armor(15)
                .lastAction(Action.PATCH)
                .build();

        RobotBattleState enemyState = RobotBattleState.builder()
                .hp(70)
                .battery(25)
                .heat(5)
                .firewall(20)
                .armor(10)
                .lastAction(Action.HARD_STRIKE)
                .build();

        context = BattleContext.builder()
                .myState(myState)
                .enemyState(enemyState)
                .turnNumber(5)
                .build();
    }

    @Test
    void lessThanTrueCase() {
        assertTrue(evaluator.evaluate("myHP < 35", context));   // 30 < 35
    }

    @Test
    void lessThanFalseCase() {
        assertFalse(evaluator.evaluate("myHP < 20", context));  // 30 < 20
    }

    @Test
    void greaterThanOrEqualTrue() {
        assertTrue(evaluator.evaluate("myBattery >= 60", context));  // 60 >= 60
        assertTrue(evaluator.evaluate("myBattery >= 50", context));  // 60 >= 50
    }

    @Test
    void greaterThanOrEqualFalse() {
        assertFalse(evaluator.evaluate("myBattery >= 61", context)); // 60 >= 61
    }

    @Test
    void equalsTurnNumber() {
        assertTrue(evaluator.evaluate("turnNumber == 5", context));
        assertFalse(evaluator.evaluate("turnNumber == 3", context));
    }

    @Test
    void andBothTrue() {
        assertTrue(evaluator.evaluate("myHP < 35 AND myBattery > 50", context)); // 30<35 && 60>50
    }

    @Test
    void andOneFalse() {
        assertFalse(evaluator.evaluate("myHP < 35 AND myBattery > 80", context)); // 30<35 && 60>80
    }

    @Test
    void orOneTrueOneFalse() {
        assertTrue(evaluator.evaluate("myHP < 10 OR myBattery > 50", context));  // false OR true
    }

    @Test
    void orBothFalse() {
        assertFalse(evaluator.evaluate("myHP < 10 OR myBattery > 80", context)); // false OR false
    }

    @Test
    void notNegation() {
        assertTrue(evaluator.evaluate("NOT myHP > 50", context));   // NOT (30 > 50) = NOT false = true
        assertFalse(evaluator.evaluate("NOT myHP < 50", context));  // NOT (30 < 50) = NOT true  = false
    }

    @Test
    void variableVsVariableComparison() {
        assertTrue(evaluator.evaluate("enemyHP > myHP", context));   // 70 > 30
        assertFalse(evaluator.evaluate("myHP > enemyHP", context));  // 30 > 70
    }

    @Test
    void unknownVariableThrows() {
        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> evaluator.evaluate("ghostStat < 10", context)
        );
        assertTrue(ex.getMessage().contains("Unknown variable: ghostStat"));
    }
}
