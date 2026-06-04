package com.algorig.algorig_backend.engine;

import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class NarrativeEngine {

    private static final String[][] SCAN_TICK_FLAVOURS = {
        {
            "%s's scanners sweep through corrupted memory sectors...",
            "%s probes deep packet layers for viral signatures...",
            "%s's diagnostic cores begin mapping system anomalies...",
            "%s initiates a full registry sweep — something is lurking..."
        },
        {
            "%s's neural processors cross-reference threat databases...",
            "%s traces suspicious data streams through secondary cores...",
            "%s's firewall logs reveal traces of intrusion — scanning deeper...",
            "%s isolates compromised memory blocks for analysis..."
        },
        {
            "%s's scan algorithms close in on detected anomalies...",
            "%s's diagnostic protocols dig into kernel-level corruption...",
            "%s triangulates the source of system degradation...",
            "%s's scan nears completion — anomalies flagged for removal..."
        },
        {
            "%s's final scan pass sweeps the last system sectors...",
            "%s prepares purge routines as the scan concludes...",
            "%s's processors hum at maximum capacity — almost done...",
            "%s locks onto the last corrupted data cluster..."
        }
    };

    public String narrateAction(
            Action action,
            String attackerName,
            String defenderName,
            ActionResult result,
            boolean isStalled
    ) {
        if (isStalled || result.isStalledDueToInsufficientBattery()) {
            return String.format(
                    "%s reaches for %s but the power reserves are empty — systems stall!",
                    attackerName,
                    action.name().replace("_", " ")
            );
        }

        return switch (action) {
            case HARD_STRIKE -> String.format(
                    "%s drives a precision strike into %s's chassis! [-%d HP]",
                    attackerName, defenderName, result.getDamageDealt()
            );
            case HEAVY_ATTACK -> String.format(
                    "%s unleashes a crushing blow — %s's armor buckles under the impact! [-%d HP]",
                    attackerName, defenderName, result.getDamageDealt()
            );
            case POWER_SURGE -> String.format(
                    "%s floods %s's circuits with a devastating power surge — firewall takes the hit! [-%d HP]",
                    attackerName, defenderName, result.getDamageDealt()
            );
            case PATCH -> String.format(
                    "%s runs emergency repair protocols — system integrity restored. [+%d HP]",
                    attackerName, result.getHealingDone()
            );
            case FIREWALL -> String.format(
                    "%s reinforces its digital defenses — firewall back online. [+%d FW]",
                    attackerName, result.getHealingDone()
            );
            case ARMOR_PLATE -> String.format(
                    "%s deploys emergency armor plating — chassis reinforced. [+%d DEF]",
                    attackerName, result.getHealingDone()
            );
            case VIRUS_UPLOAD -> String.format(
                    "%s injects a viral payload deep into %s's systems — firewall degrading! [-%d FW]",
                    attackerName, defenderName, result.getDamageDealt()
            );
            case SYSTEM_SCAN -> String.format(
                    "%s initiates a full system scan — all combat processes suspended. Scanning for threats... (%d turns)",
                    attackerName, result.getScanDuration()
            );
            case CPU_STALL -> String.format(
                    "%s's processors lock up — a critical turn wasted!",
                    attackerName
            );
            default -> result.getDescription();
        };
    }

    public String narrateScanTick(String attackerName, int turnsRemaining, int totalTurns) {
        int tickIndex = totalTurns - turnsRemaining - 1;
        int flavourGroup = Math.min(tickIndex, SCAN_TICK_FLAVOURS.length - 1);
        String[] group = SCAN_TICK_FLAVOURS[Math.max(0, flavourGroup)];
        String template = group[(int) (Math.random() * group.length)];
        return String.format(template + " (%d turn%s remaining)",
                attackerName, turnsRemaining, turnsRemaining == 1 ? "" : "s");
    }

    public String narrateScanComplete(String attackerName, List<String> debuffsRemoved) {
        if (debuffsRemoved.isEmpty()) {
            return String.format(
                    "%s's system scan concludes — no threats detected. All systems nominal.",
                    attackerName
            );
        }
        return String.format(
                "%s's system scan concludes! %d debuff%s neutralized: %s. Systems restored!",
                attackerName,
                debuffsRemoved.size(),
                debuffsRemoved.size() == 1 ? "" : "s",
                String.join(", ", debuffsRemoved)
        );
    }

    public String narrateBatteryDrain(String robotName, int drainAmount, int batteryAfter) {
        if (batteryAfter <= 10) {
            return String.format(
                    "%s's power core is critically low — systems flickering! [-%d battery, %d remaining]",
                    robotName, drainAmount, batteryAfter
            );
        } else if (batteryAfter <= 25) {
            return String.format(
                    "%s's battery reserves are dangerously depleted. [-%d battery, %d remaining]",
                    robotName, drainAmount, batteryAfter
            );
        } else {
            return String.format(
                    "%s's systems draw passively from power reserves. [-%d battery, %d remaining]",
                    robotName, drainAmount, batteryAfter
            );
        }
    }

    public String narrateBatteryDepleted(String robotName, String winnerName) {
        return String.format(
                "%s's power core depletes completely — all systems go dark! %s is declared the winner!",
                robotName, winnerName
        );
    }

    private static final String[] REPEAT_START_FLAVOURS = {
        "%s initiates a %d-strike assault sequence!",
        "%s locks onto a %d-action combat routine!",
        "%s's processors queue up a %d-step execution loop!",
        "%s engages a relentless %d-turn combat protocol!",
    };

    private static final String[] REPEAT_LOOP_FLAVOURS = {
        "%s's assault sequence continues...",
        "%s's combat routine loops back...",
        "%s executes the next step in the sequence...",
        "%s's protocol cycles forward...",
    };

    private static final String[] REPEAT_END_FLAVOURS = {
        "%s's assault sequence concludes after %d iterations!",
        "%s's combat routine completes all %d cycles!",
        "%s's execution loop terminates — all %d steps executed!",
        "%s's protocol finishes — %d actions complete!",
    };

    public String narrateRepeatStart(String robotName, int total) {
        String t = REPEAT_START_FLAVOURS[(int)(Math.random() * REPEAT_START_FLAVOURS.length)];
        return String.format(t, robotName, total);
    }

    public String narrateRepeatLoop(String robotName, int iteration, int total) {
        String t = REPEAT_LOOP_FLAVOURS[(int)(Math.random() * REPEAT_LOOP_FLAVOURS.length)];
        return String.format(t + " [Iteration %d/%d]", robotName, iteration, total);
    }

    public String narrateRepeatEnd(String robotName, int total) {
        String t = REPEAT_END_FLAVOURS[(int)(Math.random() * REPEAT_END_FLAVOURS.length)];
        return String.format(t, robotName, total);
    }

    public String narrateMemoryUpdate(String robotName, String varName,
            String operator, int oldVal, int rhsVal, int newVal) {
        String opWord = switch (operator) {
            case "+=" -> "increments";
            case "-=" -> "decrements";
            case "*=" -> "multiplies";
            case "/=" -> "divides";
            case "%=" -> "takes remainder of";
            default   -> "updates";
        };
        return String.format(
            "%s %s %s by %d: %d → %d",
            robotName, opWord, varName, rhsVal, oldVal, newVal
        );
    }

    public String narrateMemorySet(String robotName, String varName, int oldValue, int newValue) {
        if (oldValue == newValue) {
            return String.format("%s sets %s = %d", robotName, varName, newValue);
        } else if (newValue > oldValue) {
            return String.format("%s updates %s: %d → %d (+%d)", robotName, varName, oldValue, newValue, newValue - oldValue);
        } else {
            return String.format("%s updates %s: %d → %d (-%d)", robotName, varName, oldValue, newValue, oldValue - newValue);
        }
    }

    public String narrateConditionCheck(String robotName, String condition, boolean passed, boolean hasElse) {
        if (passed) {
            return String.format(
                    "%s checks — %s... Confirmed. Executing IF branch.",
                    robotName, condition
            );
        } else if (hasElse) {
            return String.format(
                    "%s checks — %s... Negative. Routing to ELSE branch.",
                    robotName, condition
            );
        } else {
            return String.format(
                    "%s checks — %s... Negative. No ELSE branch — CPU stalls.",
                    robotName, condition
            );
        }
    }
}
