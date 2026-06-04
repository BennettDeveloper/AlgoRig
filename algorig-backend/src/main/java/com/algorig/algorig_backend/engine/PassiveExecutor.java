package com.algorig.algorig_backend.engine;

import com.algorig.algorig_backend.model.entity.Robot;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PassiveExecutor {

    // -------------------------------------------------------------------------
    // Battle initialization — called once per robot at simulate() start
    // -------------------------------------------------------------------------

    public void initBattleState(ExecutionFrame frame) {
        RobotPassive passive = RobotPassive.byRobotName(frame.getRobot().getName());
        if (passive == null) return;
        PassiveState ps = frame.getState().getPassiveState();
        switch (passive) {
            case PHASE_OUT     -> ps.set("PhaseOut:dodgeAvailable", true);
            case NETWORK_SHIELD -> ps.set("NetworkShield:blockAvailable", true);
            case ZERO_DAY      -> ps.set("ZeroDay:firstSoftwareUsed", false);
            default            -> {} // all numeric states default to 0 via getInt()
        }
    }

    // -------------------------------------------------------------------------
    // Turn reset — called at the START of each robot's turn before action
    // -------------------------------------------------------------------------

    public void resetTurnState(ExecutionFrame frame) {
        RobotPassive passive = RobotPassive.byRobotName(frame.getRobot().getName());
        if (passive == null) return;
        PassiveState ps = frame.getState().getPassiveState();
        switch (passive) {
            case PHASE_OUT      -> ps.set("PhaseOut:dodgeAvailable", true);
            case NETWORK_SHIELD -> ps.set("NetworkShield:blockAvailable", true);
            default             -> {}
        }
    }

    // -------------------------------------------------------------------------
    // Pre-action — called BEFORE ActionExecutor.execute()
    // -------------------------------------------------------------------------

    public List<BattleLogEntry> applyPreAction(
            ExecutionFrame attacker, ExecutionFrame defender,
            Action action, int turn, String actor) {

        List<BattleLogEntry> logs = new ArrayList<>();
        RobotPassive passive = RobotPassive.byRobotName(attacker.getRobot().getName());
        if (passive == null) return logs;

        RobotBattleState myState = attacker.getState();

        if (passive == RobotPassive.INFINITE_LOOP) {
            // Guarantee robot never stalls — top up battery to at least 30 (max action cost)
            if (myState.getBattery() < 30) {
                int topUp = 30 - myState.getBattery();
                myState.setBattery(30);
                logs.add(passiveLog(turn, actor, passive,
                        "Emergency power: +" + topUp + " battery (never stall)",
                        attacker, defender));
            }
        }

        return logs;
    }

    // -------------------------------------------------------------------------
    // Post-action — called AFTER ActionExecutor.execute()
    // -------------------------------------------------------------------------

    public List<BattleLogEntry> applyPostAction(
            ExecutionFrame attacker, ExecutionFrame defender,
            Action action, ActionResult result, int turn, String actorLabel) {

        List<BattleLogEntry> logs = new ArrayList<>();
        String defenderLabel = "A".equals(actorLabel) ? "B" : "A";

        applyAttackerPassive(attacker, defender, action, result, turn, actorLabel, logs);

        // Defender passives only fire when actual damage was dealt
        if (result.getDamageDealt() > 0 && !result.isStalledDueToInsufficientBattery()) {
            applyDefenderPassive(defender, attacker, action, result, turn, defenderLabel, logs);
        }

        return logs;
    }

    // -------------------------------------------------------------------------
    // Attacker-side passives
    // -------------------------------------------------------------------------

    private void applyAttackerPassive(ExecutionFrame attacker, ExecutionFrame defender,
                                      Action action, ActionResult result,
                                      int turn, String actor, List<BattleLogEntry> logs) {
        RobotPassive passive = RobotPassive.byRobotName(attacker.getRobot().getName());
        if (passive == null) return;

        Robot robot = attacker.getRobot();
        RobotBattleState myState = attacker.getState();
        RobotBattleState enemyState = defender.getState();
        PassiveState ps = myState.getPassiveState();

        // Always-on healing (triggers even on CPU stall)
        if (passive == RobotPassive.SELF_REPAIR) {
            int maxHp = robot.getSystemIntegrity();
            if (myState.getHp() < maxHp) {
                int before = myState.getHp();
                myState.setHp(Math.min(maxHp, before + 3));
                logs.add(passiveLog(turn, actor, passive,
                        "Self-repair +" + (myState.getHp() - before) + " HP",
                        attacker, defender));
            }
            return;
        }

        if (passive == RobotPassive.LIFE_PULSE) {
            int counter = ps.getInt("LifePulse:counter") + 1;
            if (counter >= 3) {
                int maxHp = robot.getSystemIntegrity();
                int heal = Math.max(1, Math.round(maxHp * 0.15f));
                int before = myState.getHp();
                myState.setHp(Math.min(maxHp, before + heal));
                result.setHealingDone(result.getHealingDone() + (myState.getHp() - before));
                ps.set("LifePulse:counter", 0);
                logs.add(passiveLog(turn, actor, passive,
                        "Life Pulse healed +" + (myState.getHp() - before) + " HP (15% max)",
                        attacker, defender));
            } else {
                ps.set("LifePulse:counter", counter);
            }
            return;
        }

        // Everything below skips on stall
        if (result.isStalledDueToInsufficientBattery()) return;

        switch (passive) {

            // --- BATTERY ---

            case QUICK_REFLEXES -> {
                int bonus = Math.max(1, Math.round(robot.getWattage() * 0.10f));
                int before = myState.getBattery();
                myState.setBattery(Math.min(100, before + bonus));
                logs.add(passiveLog(turn, actor, passive,
                        "Regen efficiency +" + bonus + " battery",
                        attacker, defender));
            }

            case DEBUG_PROTOCOL -> {
                if (isSoftwareAction(action)) {
                    int refund = Math.max(1, Math.round(result.getBatterySpent() * 0.15f));
                    int before = myState.getBattery();
                    myState.setBattery(Math.min(100, before + refund));
                    logs.add(passiveLog(turn, actor, passive,
                            "Software cost -15%: +" + refund + " battery refunded",
                            attacker, defender));
                }
            }

            case OVERCHARGE -> {
                int missing = 100 - myState.getBattery();
                int bonus = missing / 10;
                if (bonus > 0) {
                    int before = myState.getBattery();
                    myState.setBattery(Math.min(100, before + bonus));
                    logs.add(passiveLog(turn, actor, passive,
                            "+" + bonus + " overcharge regen (" + missing + "% battery missing)",
                            attacker, defender));
                }
            }

            case INFINITE_LOOP -> {
                int bonus = Math.max(1, Math.round(robot.getWattage() * 0.50f));
                int before = myState.getBattery();
                myState.setBattery(Math.min(100, before + bonus));
                logs.add(passiveLog(turn, actor, passive,
                        "+50% regen: +" + bonus + " battery",
                        attacker, defender));
            }

            // --- DAMAGE BOOSTERS ---

            case ADAPTIVE_COMBAT -> {
                if (result.getDamageDealt() > 0) {
                    Object lastAct = ps.get("AdaptiveCombat:lastAction");
                    if (lastAct != null && !action.equals(lastAct)) {
                        int bonus = Math.max(1, Math.round(result.getDamageDealt() * 0.02f));
                        applyBonusDamage(defender, result, bonus);
                        logs.add(passiveLog(turn, actor, passive,
                                "Different action bonus +" + bonus + " damage (+2%)",
                                attacker, defender));
                    }
                    ps.set("AdaptiveCombat:lastAction", action);
                }
            }

            case CASCADING_OVERFLOW -> {
                if (isSoftwareAction(action) && result.getDamageDealt() > 0) {
                    int pending = ps.getInt("CascadingOverflow:pending");
                    if (pending > 0) {
                        int bonus = Math.max(1, Math.round(result.getDamageDealt() * (pending / 100f)));
                        applyBonusDamage(defender, result, bonus);
                        logs.add(passiveLog(turn, actor, passive,
                                "Overflow surge +" + bonus + " damage (+" + pending + "% exploit)",
                                attacker, defender));
                    }
                    ps.set("CascadingOverflow:pending", Math.min(50, pending + 5));
                } else {
                    ps.set("CascadingOverflow:pending", 0);
                }
            }

            case LETHAL_EDGE -> {
                if (isPhysicalAction(action) && result.getDamageDealt() > 0) {
                    boolean lowHp = enemyState.getHp() <= (defender.getRobot().getSystemIntegrity() / 2);
                    float pct = lowHp ? 0.30f : 0.15f;
                    int bonus = Math.max(1, Math.round(result.getDamageDealt() * pct));
                    applyBonusDamage(defender, result, bonus);
                    logs.add(passiveLog(turn, actor, passive,
                            lowHp ? "Low HP bonus +" + bonus + " damage (+30%)"
                                   : "Physical bonus +" + bonus + " damage (+15%)",
                            attacker, defender));
                }
            }

            case COMBAT_RHYTHM -> {
                if (result.getDamageDealt() > 0) {
                    String lastType = (String) ps.get("CombatRhythm:lastType");
                    String thisType = isPhysicalAction(action) ? "physical" : "software";
                    if (lastType != null && !lastType.equals(thisType)) {
                        int bonus = Math.max(1, Math.round(result.getDamageDealt() * 0.08f));
                        applyBonusDamage(defender, result, bonus);
                        logs.add(passiveLog(turn, actor, passive,
                                "Rhythm bonus +" + bonus + " damage (+8%, alternating types)",
                                attacker, defender));
                    }
                    ps.set("CombatRhythm:lastType", thisType);
                }
            }

            case HYPERDRIVE -> {
                final int MAX_STACKS = 10;
                int stack = ps.getInt("Hyperdrive:stack");
                int newStack = Math.min(MAX_STACKS, stack + 1);
                ps.set("Hyperdrive:stack", newStack);
                if (result.getDamageDealt() > 0 && stack > 0) {
                    int bonus = Math.max(1, Math.round(result.getDamageDealt() * stack * 0.05f));
                    applyBonusDamage(defender, result, bonus);
                    logs.add(passiveLog(turn, actor, passive,
                            "+" + bonus + " damage (+" + (stack * 5) + "% charged) → +" + (newStack * 5) + "% next turn",
                            attacker, defender));
                } else {
                    logs.add(passiveLog(turn, actor, passive,
                            "Drive charge → +" + (newStack * 5) + "% next turn",
                            attacker, defender));
                }
            }

            case TEMPEST -> {
                int stack = ps.getInt("Tempest:stack");
                int newStack = Math.min(50, stack + 1);
                ps.set("Tempest:stack", newStack);
                if (result.getDamageDealt() > 0 && stack > 0) {
                    int bonus = Math.max(1, Math.round(result.getDamageDealt() * (stack / 100f)));
                    applyBonusDamage(defender, result, bonus);
                    logs.add(passiveLog(turn, actor, passive,
                            "+" + bonus + " damage (+" + stack + "% storm) → +" + newStack + "% next turn",
                            attacker, defender));
                }
            }

            case SILENT_EXECUTION -> {
                if (isSoftwareAction(action) && result.getDamageDealt() > 0) {
                    int bonus = Math.max(1, Math.round(defender.getRobot().getFirewallStrength() * 0.10f));
                    applyBonusDamage(defender, result, bonus);
                    logs.add(passiveLog(turn, actor, passive,
                            "Firewall bypass +" + bonus + " damage (20% FW ignored)",
                            attacker, defender));
                }
            }

            case MOMENTUM -> {
                if (isPhysicalAction(action)) {
                    int speedBonus = Math.min(15, ps.getInt("Momentum:speedBonus") + 3);
                    ps.set("Momentum:speedBonus", speedBonus);
                    int batteryBonus = Math.max(1, Math.round(speedBonus * 0.2f));
                    myState.setBattery(Math.min(100, myState.getBattery() + batteryBonus));
                    logs.add(passiveLog(turn, actor, passive,
                            "Momentum +" + speedBonus + "% speed → +" + batteryBonus + " battery efficiency",
                            attacker, defender));
                }
            }

            // --- HEALING ---

            case VITAL_SYSTEMS -> {
                if (action == Action.PATCH && result.getHealingDone() > 0) {
                    int maxHp = robot.getSystemIntegrity();
                    int bonus = Math.max(1, Math.round(result.getHealingDone() * 0.20f));
                    int before = myState.getHp();
                    myState.setHp(Math.min(maxHp, before + bonus));
                    int actual = myState.getHp() - before;
                    result.setHealingDone(result.getHealingDone() + actual);
                    logs.add(passiveLog(turn, actor, passive,
                            "Vital Systems +" + actual + " bonus healing (+20%)",
                            attacker, defender));
                }
            }

            case EMERGENCY_PROTOCOL -> {
                if (action == Action.PATCH && result.getHealingDone() > 0) {
                    int maxHp = robot.getSystemIntegrity();
                    if (myState.getHp() < Math.round(maxHp * 0.30f)) {
                        int bonus = Math.max(1, Math.round(result.getHealingDone() * 0.15f));
                        int before = myState.getHp();
                        myState.setHp(Math.min(maxHp, before + bonus));
                        int actual = myState.getHp() - before;
                        result.setHealingDone(result.getHealingDone() + actual);
                        logs.add(passiveLog(turn, actor, passive,
                                "Emergency Protocol +" + actual + " HP (HP < 30%)",
                                attacker, defender));
                    }
                }
            }

            // --- DEFENSIVE / RESTORATION ---

            case FORTIFIED_STRUCTURE -> {
                if (action == Action.FIREWALL && result.getHealingDone() > 0) {
                    int bonus = Math.max(1, Math.round(result.getHealingDone() * 0.15f));
                    int cap = robot.getFirewallStrength();
                    int before = myState.getFirewall();
                    myState.setFirewall(Math.min(cap, before + bonus));
                    int actual = myState.getFirewall() - before;
                    if (actual > 0) {
                        logs.add(passiveLog(turn, actor, passive,
                                "Fortified +" + actual + " firewall (+15%)", attacker, defender));
                    }
                } else if (action == Action.ARMOR_PLATE && result.getHealingDone() > 0) {
                    int bonus = Math.max(1, Math.round(result.getHealingDone() * 0.15f));
                    int cap = robot.getChassisArmor();
                    int before = myState.getArmor();
                    myState.setArmor(Math.min(cap, before + bonus));
                    int actual = myState.getArmor() - before;
                    if (actual > 0) {
                        logs.add(passiveLog(turn, actor, passive,
                                "Fortified +" + actual + " armor (+15%)", attacker, defender));
                    }
                }
            }

            // --- UTILITY ---

            case INFECTION -> {
                if (action == Action.VIRUS_UPLOAD && result.getDamageDealt() > 0) {
                    int extra = result.getDamageDealt();
                    int newFw = Math.max(0, enemyState.getFirewall() - extra);
                    enemyState.setFirewall(newFw);
                    result.setDamageDealt(result.getDamageDealt() + extra);
                    logs.add(passiveLog(turn, actor, passive,
                            "Infection: double firewall drain -" + extra + " FW",
                            attacker, defender));
                }
            }

            case PERMAFROST -> {
                if (!isSupportAction(action)) {
                    int drain = 5;
                    int before = enemyState.getBattery();
                    enemyState.setBattery(Math.max(0, before - drain));
                    logs.add(passiveLog(turn, actor, passive,
                            "Permafrost: enemy -" + drain + " battery (" + before + " → " + enemyState.getBattery() + ")",
                            attacker, defender));
                }
            }

            case ZERO_DAY -> {
                if (isSoftwareAction(action) && result.getDamageDealt() > 0) {
                    if (!ps.getBoolean("ZeroDay:firstSoftwareUsed")) {
                        int bonus = Math.max(1, Math.round(result.getDamageDealt() * 0.50f));
                        applyBonusDamage(defender, result, bonus);
                        ps.set("ZeroDay:firstSoftwareUsed", true);
                        logs.add(passiveLog(turn, actor, passive,
                                "Zero-Day first strike: +" + bonus + " damage (50% FW ignored)",
                                attacker, defender));
                    }
                    if (action == Action.VIRUS_UPLOAD) {
                        int extra = result.getDamageDealt() * 2;
                        int newFw = Math.max(0, enemyState.getFirewall() - extra);
                        enemyState.setFirewall(newFw);
                        logs.add(passiveLog(turn, actor, passive,
                                "Zero-Day: triple Virus Upload drain -" + extra + " FW",
                                attacker, defender));
                    }
                }
            }

            // Handled on defender side or turn reset
            case IRON_WILL, RESILIENT_FRAME, PHASE_SHIFT, PERFECT_FORM,
                 UNBREAKABLE, REINFORCED, PHASE_OUT, NETWORK_SHIELD -> {}

            default -> {}
        }
    }

    // -------------------------------------------------------------------------
    // Defender-side passives — runs when THIS robot was just hit
    // -------------------------------------------------------------------------

    private void applyDefenderPassive(ExecutionFrame defender, ExecutionFrame attacker,
                                      Action attackAction, ActionResult result,
                                      int turn, String defActor, List<BattleLogEntry> logs) {
        RobotPassive passive = RobotPassive.byRobotName(defender.getRobot().getName());
        if (passive == null) return;

        RobotBattleState defState = defender.getState();
        PassiveState ps = defState.getPassiveState();

        switch (passive) {

            case RESILIENT_FRAME -> {
                int reduction = Math.max(1, Math.round(result.getDamageDealt() * 0.05f));
                restoreDamage(defender, result, reduction);
                logs.add(passiveLog(turn, defActor, passive,
                        "Resilient Frame -" + reduction + " damage taken (-5%)",
                        defender, attacker));
            }

            case PHASE_SHIFT -> {
                if (turn <= 3) {
                    int reduction = Math.max(1, Math.round(result.getDamageDealt() * 0.25f));
                    restoreDamage(defender, result, reduction);
                    logs.add(passiveLog(turn, defActor, passive,
                            "Phase Shift -" + reduction + " damage (-25%, turn " + turn + "/3)",
                            defender, attacker));
                }
            }

            case PERFECT_FORM -> {
                int reduction = Math.max(1, Math.round(result.getDamageDealt() * 0.10f));
                restoreDamage(defender, result, reduction);
                logs.add(passiveLog(turn, defActor, passive,
                        "Perfect Form -" + reduction + " damage (-10%)",
                        defender, attacker));
            }

            case UNBREAKABLE -> {
                boolean hadReduction = ps.getBoolean("Unbreakable:nextTurnReduction");
                if (hadReduction) {
                    int reduction = Math.max(1, Math.round(result.getDamageDealt() * 0.20f));
                    restoreDamage(defender, result, reduction);
                    ps.set("Unbreakable:nextTurnReduction", false);
                    logs.add(passiveLog(turn, defActor, passive,
                            "Unbreakable -" + reduction + " damage (-20%)",
                            defender, attacker));
                }
                if (result.getDamageDealt() >= 40) {
                    ps.set("Unbreakable:nextTurnReduction", true);
                    logs.add(passiveLog(turn, defActor, passive,
                            "Unbreakable primed: 40+ damage taken — 20% reduction next turn",
                            defender, attacker));
                }
            }

            case REINFORCED -> {
                int reduction = Math.max(1, Math.round(result.getDamageDealt() * 0.10f));
                restoreDamage(defender, result, reduction);
                logs.add(passiveLog(turn, defActor, passive,
                        "Reinforced -" + reduction + " damage (-10%)",
                        defender, attacker));
            }

            case PHASE_OUT -> {
                if (ps.getBoolean("PhaseOut:dodgeAvailable")) {
                    int dodged = result.getDamageDealt();
                    restoreDamage(defender, result, dodged);
                    ps.set("PhaseOut:dodgeAvailable", false);
                    logs.add(passiveLog(turn, defActor, passive,
                            "Phase Out: dodged " + dodged + " damage",
                            defender, attacker));
                }
            }

            case NETWORK_SHIELD -> {
                if (attackAction == Action.VIRUS_UPLOAD && ps.getBoolean("NetworkShield:blockAvailable")) {
                    int blocked = result.getDamageDealt();
                    defState.setFirewall(Math.min(
                            defender.getRobot().getFirewallStrength(),
                            defState.getFirewall() + blocked));
                    ps.set("NetworkShield:blockAvailable", false);
                    logs.add(passiveLog(turn, defActor, passive,
                            "Network Shield: VIRUS_UPLOAD blocked (+" + blocked + " FW restored)",
                            defender, attacker));
                }
            }

            case HYPERDRIVE -> {
                int oldStack = ps.getInt("Hyperdrive:stack");
                if (oldStack > 0) {
                    ps.set("Hyperdrive:stack", 0);
                    logs.add(passiveLog(turn, defActor, passive,
                            "Hyperdrive reset (damage taken, was +" + (oldStack * 5) + "%)",
                            defender, attacker));
                }
            }

            case TEMPEST -> {
                if (result.getDamageDealt() >= 50) {
                    int oldStack = ps.getInt("Tempest:stack");
                    ps.set("Tempest:stack", 0);
                    if (oldStack > 0) {
                        logs.add(passiveLog(turn, defActor, passive,
                                "Tempest stack reset (50+ damage, was +" + oldStack + "%)",
                                defender, attacker));
                    }
                }
            }

            default -> {}
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private void applyBonusDamage(ExecutionFrame defender, ActionResult result, int bonus) {
        defender.getState().setHp(defender.getState().getHp() - bonus);
        result.setDamageDealt(result.getDamageDealt() + bonus);
    }

    private void restoreDamage(ExecutionFrame defender, ActionResult result, int reduction) {
        int maxHp = defender.getRobot().getSystemIntegrity();
        defender.getState().setHp(Math.min(maxHp, defender.getState().getHp() + reduction));
        result.setDamageDealt(Math.max(0, result.getDamageDealt() - reduction));
    }

    private boolean isPhysicalAction(Action action) {
        return action == Action.HARD_STRIKE || action == Action.HEAVY_ATTACK;
    }

    private boolean isSoftwareAction(Action action) {
        return action == Action.POWER_SURGE || action == Action.VIRUS_UPLOAD;
    }

    private boolean isSupportAction(Action action) {
        return action == Action.PATCH || action == Action.FIREWALL
                || action == Action.ARMOR_PLATE || action == Action.SYSTEM_SCAN;
    }

    private BattleLogEntry passiveLog(int turn, String actor, RobotPassive passive,
                                      String effect, ExecutionFrame self, ExecutionFrame other) {
        return BattleLogEntry.builder()
                .turn(turn)
                .actor(actor)
                .entryType("PASSIVE_EFFECT")
                .passiveTriggered(passive.getDisplayName())
                .passiveEffect(effect)
                .attackerHpAfter(self.getState().getHp())
                .defenderHpAfter(other.getState().getHp())
                .attackerBatteryAfter(self.getState().getBattery())
                .description("[PASSIVE] " + passive.getDisplayName() + ": " + effect)
                .build();
    }
}
