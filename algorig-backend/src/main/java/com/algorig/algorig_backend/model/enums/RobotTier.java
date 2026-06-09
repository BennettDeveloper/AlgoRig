package com.algorig.algorig_backend.model.enums;

public enum RobotTier {
    TIER_1(1),
    TIER_2(2),
    TIER_3(3),
    TIER_4(4),
    TIER_5(5);

    private final int value;

    RobotTier(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public static RobotTier fromValue(int v) {
        for (RobotTier t : values()) {
            if (t.value == v) return t;
        }
        throw new IllegalArgumentException("Unknown robot tier value: " + v);
    }
}
