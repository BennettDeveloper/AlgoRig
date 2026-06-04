package com.algorig.algorig_backend.engine;

import org.springframework.stereotype.Component;

@Component
public class ExpressionEvaluator {

    public int evaluate(String expression, BattleContext context, RobotMemory memory) {
        String expr = expression.trim();

        // Try simple integer literal
        try {
            return Integer.parseInt(expr);
        } catch (NumberFormatException ignored) {}

        // Try binary arithmetic: find " OP " pattern (space-delimited for safety)
        for (char op : new char[]{'+', '-', '*', '/'}) {
            String pattern = " " + op + " ";
            int idx = expr.indexOf(pattern);
            if (idx > 0) {
                int left  = evaluate(expr.substring(0, idx).trim(), context, memory);
                int right = evaluate(expr.substring(idx + pattern.length()).trim(), context, memory);
                return switch (op) {
                    case '+' -> left + right;
                    case '-' -> left - right;
                    case '*' -> left * right;
                    case '/' -> right != 0 ? left / right : 0;
                    default  -> throw new RuntimeException("Unknown operator: " + op);
                };
            }
        }

        // Try variable (battle context or user memory)
        return resolveVariable(expr, context, memory);
    }

    private int resolveVariable(String token, BattleContext context, RobotMemory memory) {
        return switch (token) {
            case "myHP"            -> context.getMyState().getHp();
            case "enemyHP"         -> context.getEnemyState().getHp();
            case "myBattery"       -> context.getMyState().getBattery();
            case "enemyBattery"    -> context.getEnemyState().getBattery();
            case "myArmor"         -> context.getMyState().getArmor();
            case "enemyArmor"      -> context.getEnemyState().getArmor();
            case "myFirewall"      -> context.getMyState().getFirewall();
            case "enemyFirewall"   -> context.getEnemyState().getFirewall();
            case "myHeat"          -> context.getMyState().getHeat();
            case "enemyHeat"       -> context.getEnemyState().getHeat();
            case "turnNumber"      -> context.getTurnNumber();
            default -> {
                if (memory.has(token)) yield memory.get(token);
                try {
                    yield Integer.parseInt(token);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Unknown variable in expression: " + token);
                }
            }
        };
    }
}
