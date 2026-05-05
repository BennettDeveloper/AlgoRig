package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import org.springframework.stereotype.Component;

@Component
public class ActionExecutor {

    public ActionResult execute(Action action, ExecutionFrame attacker, ExecutionFrame defender) {
        int cost = batteryCost(action, attacker.getRobot());

        if (attacker.getState().getBattery() < cost) {
            return ActionResult.builder()
                    .actionTaken(Action.CPU_STALL)
                    .stalledDueToInsufficientBattery(true)
                    .batterySpent(0)
                    .description("Insufficient battery for " + action + ", CPU stalled")
                    .build();
        }

        ActionResult result = applyEffect(action, attacker, defender);

        // Deduct cost, gain wattage, cap at 100
        int newBattery = Math.min(100, attacker.getState().getBattery() - cost + attacker.getRobot().getWattage());
        attacker.getState().setBattery(newBattery);
        attacker.getState().setLastAction(action);
        result.setBatterySpent(cost);

        return result;
    }

    // -------------------------------------------------------------------------
    // Battery cost
    // -------------------------------------------------------------------------

    private int batteryCost(Action action, Robot robot) {
        int raw = switch (action) {
            case HARD_STRIKE   -> 20 - (robot.getClockSpeed() / 10);
            case HEAVY_ATTACK  -> 30 - (robot.getClockSpeed() / 10);
            case POWER_SURGE   -> 25 - (robot.getClockSpeed() / 10);
            case PATCH         -> 15 - (robot.getRecovery() / 10);
            case FIREWALL      -> 20 - (robot.getFirewallStrength() / 10);
            case ARMOR_PLATE   -> 20 - (robot.getChassisArmor() / 10);
            case VIRUS_UPLOAD  -> 25 - (robot.getExploitPower() / 10);
            case SYSTEM_SCAN   -> 10;
            case CPU_STALL     -> 0;
        };
        return Math.max(5, raw);
    }

    // -------------------------------------------------------------------------
    // Action effects
    // -------------------------------------------------------------------------

    private ActionResult applyEffect(Action action, ExecutionFrame attacker, ExecutionFrame defender) {
        Robot atk = attacker.getRobot();
        Robot def = defender.getRobot();

        return switch (action) {

            case HARD_STRIKE -> {
                int damage = Math.max(1, atk.getCoreImpact() - def.getChassisArmor() / 2);
                defender.getState().setHp(defender.getState().getHp() - damage);
                yield ActionResult.builder()
                        .actionTaken(action)
                        .damageDealt(damage)
                        .description("HARD_STRIKE dealt " + damage + " damage")
                        .build();
            }

            case HEAVY_ATTACK -> {
                int damage = Math.max(1, (int)(atk.getCoreImpact() * 1.5) - def.getChassisArmor() / 2);
                defender.getState().setHp(defender.getState().getHp() - damage);
                yield ActionResult.builder()
                        .actionTaken(action)
                        .damageDealt(damage)
                        .description("HEAVY_ATTACK dealt " + damage + " damage")
                        .build();
            }

            case POWER_SURGE -> {
                int damage = Math.max(1, atk.getExploitPower() - def.getFirewallStrength() / 2);
                defender.getState().setHp(defender.getState().getHp() - damage);
                yield ActionResult.builder()
                        .actionTaken(action)
                        .damageDealt(damage)
                        .description("POWER_SURGE dealt " + damage + " damage")
                        .build();
            }

            case PATCH -> {
                int before = attacker.getState().getHp();
                int newHp = Math.min(before + atk.getRecovery(), atk.getSystemIntegrity());
                int healed = newHp - before;
                attacker.getState().setHp(newHp);
                yield ActionResult.builder()
                        .actionTaken(action)
                        .healingDone(healed)
                        .description("PATCH healed " + healed + " HP")
                        .build();
            }

            case FIREWALL -> {
                int before = attacker.getState().getFirewall();
                int newFw = Math.min(before + atk.getFirewallStrength() / 2, atk.getFirewallStrength());
                int restored = newFw - before;
                attacker.getState().setFirewall(newFw);
                yield ActionResult.builder()
                        .actionTaken(action)
                        .description("FIREWALL restored " + restored + " firewall")
                        .build();
            }

            case ARMOR_PLATE -> {
                int before = attacker.getState().getArmor();
                int newArmor = Math.min(before + atk.getChassisArmor() / 2, atk.getChassisArmor());
                int restored = newArmor - before;
                attacker.getState().setArmor(newArmor);
                yield ActionResult.builder()
                        .actionTaken(action)
                        .description("ARMOR_PLATE restored " + restored + " armor")
                        .build();
            }

            case VIRUS_UPLOAD -> {
                int reduction = atk.getExploitPower() / 3;
                int newFw = Math.max(0, defender.getState().getFirewall() - reduction);
                defender.getState().setFirewall(newFw);
                yield ActionResult.builder()
                        .actionTaken(action)
                        .description("VIRUS_UPLOAD reduced enemy firewall by " + reduction)
                        .build();
            }

            case SYSTEM_SCAN -> ActionResult.builder()
                    .actionTaken(action)
                    .description("SYSTEM_SCAN complete")
                    .build();

            case CPU_STALL -> ActionResult.builder()
                    .actionTaken(action)
                    .description("CPU stalled")
                    .build();
        };
    }
}
