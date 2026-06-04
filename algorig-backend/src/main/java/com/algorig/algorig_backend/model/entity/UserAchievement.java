package com.algorig.algorig_backend.model.entity;

import com.algorig.algorig_backend.model.enums.AchievementType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_achievements",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "achievement_type"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "achievement_type", nullable = false, length = 50)
    private AchievementType achievementType;

    @Column(name = "awarded_at", nullable = false)
    private LocalDateTime awardedAt;

    @Column(name = "battle_id")
    private Long battleId;

    @PrePersist
    protected void onCreate() {
        this.awardedAt = LocalDateTime.now();
    }
}
