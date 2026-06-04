package com.algorig.algorig_backend.model.enums;

public enum AchievementType {

    FIRST_BLOOD(
        "First Blood",
        "Win your first battle",
        "⚔️"
    ),
    SCRIPTER(
        "Scripter",
        "Create 3 scripts",
        "📝"
    ),
    VETERAN(
        "Veteran",
        "Fight 25 battles",
        "🎖️"
    ),
    DOMINATOR(
        "Dominator",
        "Win 5 battles in a row",
        "👑"
    ),
    APEX_CHALLENGER(
        "Apex Challenger",
        "Use a Tier 5 robot in battle",
        "🤖"
    ),
    VARIETY_PACK(
        "Variety Pack",
        "Use 5 different robots across all battles",
        "🎲"
    );

    private final String displayName;
    private final String description;
    private final String icon;

    AchievementType(String displayName, String description, String icon) {
        this.displayName = displayName;
        this.description = description;
        this.icon = icon;
    }

    public String getDisplayName() { return displayName; }
    public String getDescription()  { return description; }
    public String getIcon()         { return icon; }
}
