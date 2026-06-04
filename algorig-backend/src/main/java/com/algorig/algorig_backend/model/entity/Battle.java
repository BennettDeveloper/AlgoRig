package com.algorig.algorig_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "battles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Battle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "battle_code", unique = true, nullable = false, length = 13)
    private String battleCode;

    private Long robotAId;
    private Long robotBId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_a_id")
    @ToString.Exclude
    private Script scriptA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_b_id")
    @ToString.Exclude
    private Script scriptB;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    @ToString.Exclude
    private User owner;

    private String winnerId;
    private int totalTurns;

    @Column(columnDefinition = "TEXT")
    private String battleLog;

    private LocalDateTime foughtAt;

    @PrePersist
    protected void onCreate() {
        this.foughtAt = LocalDateTime.now();
    }

    public boolean isPublic() {
        if (scriptA == null || scriptB == null) return false;
        return scriptA.isPublic() && scriptB.isPublic();
    }
}
