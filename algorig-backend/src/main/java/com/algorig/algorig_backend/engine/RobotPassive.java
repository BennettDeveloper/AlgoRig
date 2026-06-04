package com.algorig.algorig_backend.engine;

public enum RobotPassive {
    // TIER 1
    QUICK_REFLEXES("BoltJr", "Quick Reflexes", "Gain +10% battery regen efficiency"),
    DEBUG_PROTOCOL("GlitchBot", "Debug Protocol", "Software attacks cost 15% less battery"),
    SELF_REPAIR("NanoUnit", "Self-Repair", "Gain +3 HP per turn"),
    IRON_WILL("RustBucket", "Iron Will", "Reduce debuff duration by 1 turn"),
    RESILIENT_FRAME("Sparky", "Resilient Frame", "Reduce damage taken by 5%"),

    // TIER 2
    ADAPTIVE_COMBAT("ByteBlade", "Adaptive Combat", "Each different action grants +2% damage to next"),
    FORTIFIED_STRUCTURE("IronClad", "Fortified Structure", "+15% armor/firewall restoration"),
    VITAL_SYSTEMS("PatchBot", "Vital Systems", "Patch heals 20% more and removes 1 debuff"),
    CASCADING_OVERFLOW("SurgeUnit", "Cascading Overflow", "Software attacks grant +5% exploit power next turn"),
    MOMENTUM("SwiftStrike", "Momentum", "Physical attacks grant +3% speed (max +15%)"),
    UNBREAKABLE("WallBot", "Unbreakable", "After 40+ damage taken, gain 20% reduction next turn"),

    // TIER 3
    COMBAT_RHYTHM("CrimsonCore", "Combat Rhythm", "Alternate attack types for +8% damage"),
    PHASE_SHIFT("GhostCPU", "Phase Shift", "+25% damage reduction for first 3 turns"),
    PERMAFROST("IceWall", "Permafrost", "Enemy's next action costs +20% battery"),
    EMERGENCY_PROTOCOL("MedBay", "Emergency Protocol", "At HP < 30%, gain +15% healing boost next turn"),
    OVERCHARGE("ThunderBolt", "Overcharge", "+1 battery regen per 10% battery missing"),
    INFECTION("VirusX", "Infection", "Virus Upload applies double debuff duration"),
    NETWORK_SHIELD("GridLock", "Network Shield", "Block first status effect each turn"),

    // TIER 4
    LETHAL_EDGE("NovaBlade", "Lethal Edge", "Physical attacks +15% damage, +30% if enemy HP < 50%"),
    SILENT_EXECUTION("PhantomOS", "Silent Execution", "Software attacks ignore 20% enemy firewall"),
    LIFE_PULSE("PulseHealer", "Life Pulse", "Heal 15% max HP every 3 turns"),
    TEMPEST("StormRider", "Tempest", "+1% damage per turn (max +50%, resets on 50+ damage taken)"),
    REINFORCED("TitanShell", "Reinforced", "Reduce damage by 10%, Armor Plate extends effect"),

    // TIER 5
    PERFECT_FORM("AbsoluteZero", "Perfect Form", "+10% resistance to all damage and effects"),
    HYPERDRIVE("HyperStrike", "Hyperdrive", "Every action grants +5% damage next turn"),
    ZERO_DAY("NetReaper", "Zero-Day", "First software attack ignores 50% firewall, Virus Upload triple duration"),
    INFINITE_LOOP("OmegaCore", "Infinite Loop", "+50% battery regen, never stall"),
    PHASE_OUT("VoidWalker", "Phase Out", "Dodge first attack each turn");

    private final String robotName;
    private final String displayName;
    private final String description;

    RobotPassive(String robotName, String displayName, String description) {
        this.robotName = robotName;
        this.displayName = displayName;
        this.description = description;
    }

    public String getRobotName() { return robotName; }
    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }

    public static RobotPassive byRobotName(String robotName) {
        for (RobotPassive p : RobotPassive.values()) {
            if (p.robotName.equals(robotName)) {
                return p;
            }
        }
        return null;
    }
}
