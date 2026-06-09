package com.algorig.algorig_backend.dto;

import com.algorig.algorig_backend.engine.RobotPassive;
import com.algorig.algorig_backend.model.enums.RobotTier;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomRobotRequest {

    @NotBlank(message = "Robot name is required.")
    private String name;

    @NotNull(message = "Tier is required.")
    private RobotTier tier;

    @Min(value = 1, message = "HP must be at least 1.")
    private int hp;

    @Min(value = 1, message = "Core Impact must be at least 1.")
    private int coreImpact;

    @Min(value = 1, message = "Exploit Power must be at least 1.")
    private int exploitPower;

    @Min(value = 1, message = "Clock Speed must be at least 1.")
    private int clockSpeed;

    @Min(value = 1, message = "Chassis Armor must be at least 1.")
    private int chassisArmor;

    @Min(value = 1, message = "Firewall Strength must be at least 1.")
    private int firewallStrength;

    @Min(value = 1, message = "Battery must be at least 1.")
    private int battery;

    @NotNull(message = "Passive ability is required.")
    private RobotPassive passiveAbility;

    private String partsConfig;
}
