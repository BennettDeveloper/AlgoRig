package com.algorig.algorig_backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RobotDto {

    private Long id;
    private String name;
    private int tier;
    private int systemIntegrity;
    private int coreImpact;
    private int chassisArmor;
    private int clockSpeed;
    private int battery;
    private int wattage;
    private int cooling;
    private int exploitPower;
    private int firewallStrength;
    private int memory;
    private int stability;
    private int recovery;
}
