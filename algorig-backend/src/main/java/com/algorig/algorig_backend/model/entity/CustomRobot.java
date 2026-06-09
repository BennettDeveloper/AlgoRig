package com.algorig.algorig_backend.model.entity;

import com.algorig.algorig_backend.engine.RobotPassive;
import com.algorig.algorig_backend.model.enums.RobotTier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "custom_robots",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_custom_robots_user_name",
        columnNames = {"user_id", "name"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomRobot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RobotTier tier;

    @Column(nullable = false)
    private int hp;

    @Column(name = "core_impact", nullable = false)
    private int coreImpact;

    @Column(name = "exploit_power", nullable = false)
    private int exploitPower;

    @Column(name = "clock_speed", nullable = false)
    private int clockSpeed;

    @Column(name = "chassis_armor", nullable = false)
    private int chassisArmor;

    @Column(name = "firewall_strength", nullable = false)
    private int firewallStrength;

    @Column(nullable = false)
    private int battery;

    @Enumerated(EnumType.STRING)
    @Column(name = "passive_ability", nullable = false)
    private RobotPassive passiveAbility;

    @Column(name = "parts_config", columnDefinition = "TEXT")
    private String partsConfig;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
