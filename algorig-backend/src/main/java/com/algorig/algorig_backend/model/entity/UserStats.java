package com.algorig.algorig_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStats {

    @Id
    @Column(name = "user_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    private User user;

    @Column(nullable = false)
    private int wins;

    @Column(nullable = false)
    private int losses;

    @Column(nullable = false)
    private int draws;

    @Column(nullable = false)
    private int totalBattles;

    @Column(nullable = false)
    private int currentStreak;

    @Column(nullable = false)
    private int bestStreak;

    @Column(nullable = false)
    private long totalTurnsPlayed;

    @Column(name = "favorite_robot_id")
    private Long favoriteRobotId;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }
}
