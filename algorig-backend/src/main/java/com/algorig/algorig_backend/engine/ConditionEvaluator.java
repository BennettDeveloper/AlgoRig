package com.algorig.algorig_backend.engine;

import org.springframework.stereotype.Component;

@Component
public class ConditionEvaluator {

    public boolean evaluate(String condition, BattleContext context) {
        String trimmed = condition.trim();

        // OR has lowest precedence — split first so AND/NOT bind tighter
        if (trimmed.contains(" OR ")) {
            for (String part : trimmed.split(" OR ")) {
                if (evaluate(part.trim(), context)) return true;
            }
            return false;
        }

        // AND has medium precedence
        if (trimmed.contains(" AND ")) {
            for (String part : trimmed.split(" AND ")) {
                if (!evaluate(part.trim(), context)) return false;
            }
            return true;
        }

        // NOT has highest precedence
        if (trimmed.startsWith("NOT ")) {
            return !evaluate(trimmed.substring(4).trim(), context);
        }

        return evaluateSimple(trimmed, context);
    }

    private boolean evaluateSimple(String condition, BattleContext context) {
        // Check two-char operators before one-char to avoid partial matches
        String[] operators = {"<=", ">=", "==", "!=", "<", ">"};
        for (String op : operators) {
            int idx = condition.indexOf(op);
            if (idx != -1) {
                int left = resolveValue(condition.substring(0, idx).trim(), context);
                int right = resolveValue(condition.substring(idx + op.length()).trim(), context);
                return switch (op) {
                    case "<"  -> left < right;
                    case ">"  -> left > right;
                    case "<=" -> left <= right;
                    case ">=" -> left >= right;
                    case "==" -> left == right;
                    case "!=" -> left != right;
                    default   -> throw new RuntimeException("Unknown operator: " + op);
                };
            }
        }
        throw new RuntimeException("Unknown operator in condition: " + condition);
    }

    private int resolveValue(String token, BattleContext context) {
        return switch (token) {
            case "myHP"           -> context.getMyState().getHp();
            case "enemyHP"        -> context.getEnemyState().getHp();
            case "myBattery"      -> context.getMyState().getBattery();
            case "enemyBattery"   -> context.getEnemyState().getBattery();
            case "myHeat"         -> context.getMyState().getHeat();
            case "enemyHeat"      -> context.getEnemyState().getHeat();
            case "myFirewall"     -> context.getMyState().getFirewall();
            case "enemyFirewall"  -> context.getEnemyState().getFirewall();
            case "myArmor"        -> context.getMyState().getArmor();
            case "enemyArmor"     -> context.getEnemyState().getArmor();
            case "turnNumber"     -> context.getTurnNumber();
            case "lastMyAction"   -> context.getMyState().getLastAction() == null
                                        ? -1 : context.getMyState().getLastAction().ordinal();
            case "lastEnemyAction" -> context.getEnemyState().getLastAction() == null
                                        ? -1 : context.getEnemyState().getLastAction().ordinal();
            default -> {
                try {
                    yield Integer.parseInt(token);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Unknown variable: " + token);
                }
            }
        };
    }
}
