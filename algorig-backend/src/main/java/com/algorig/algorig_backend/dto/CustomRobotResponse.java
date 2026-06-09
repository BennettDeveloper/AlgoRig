package com.algorig.algorig_backend.dto;

import com.algorig.algorig_backend.engine.RobotPassive;
import com.algorig.algorig_backend.model.entity.CustomRobot;
import com.algorig.algorig_backend.model.enums.RobotTier;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomRobotResponse {

    private Long id;
    private Long userId;
    private String name;
    private RobotTier tier;
    private int hp;
    private int coreImpact;
    private int exploitPower;
    private int clockSpeed;
    private int chassisArmor;
    private int firewallStrength;
    private int battery;
    private RobotPassive passiveAbility;
    private String partsConfig;
    private LocalDateTime createdAt;

    public static CustomRobotResponse fromEntity(CustomRobot robot) {
        return CustomRobotResponse.builder()
                .id(robot.getId())
                .userId(robot.getUser() != null ? robot.getUser().getId() : null)
                .name(robot.getName())
                .tier(robot.getTier())
                .hp(robot.getHp())
                .coreImpact(robot.getCoreImpact())
                .exploitPower(robot.getExploitPower())
                .clockSpeed(robot.getClockSpeed())
                .chassisArmor(robot.getChassisArmor())
                .firewallStrength(robot.getFirewallStrength())
                .battery(robot.getBattery())
                .passiveAbility(robot.getPassiveAbility())
                .partsConfig(robot.getPartsConfig())
                .createdAt(robot.getCreatedAt())
                .build();
    }
}
