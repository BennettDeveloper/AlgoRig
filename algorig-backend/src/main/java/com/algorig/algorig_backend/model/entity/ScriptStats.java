package com.algorig.algorig_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "script_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptStats {

    @Id
    @Column(name = "script_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "script_id")
    @ToString.Exclude
    private Script script;

    @Column(nullable = false)
    private int wins;

    @Column(nullable = false)
    private int losses;

    @Column(nullable = false)
    private int draws;

    @Column(name = "total_battles", nullable = false)
    private int totalBattles;

    @Column(name = "times_used", nullable = false)
    private int timesUsed;

    @Column(name = "win_rate", nullable = false)
    private double winRate;

    @Column(name = "tier_normalized_win_rate", nullable = false)
    private double tierNormalizedWinRate;

    @Column(name = "distinct_contexts", nullable = false)
    private int distinctContexts;

    @Column(name = "last_battled_at")
    private LocalDateTime lastBattledAt;

    @Column(name = "stats_since")
    private LocalDateTime statsSince;
}
