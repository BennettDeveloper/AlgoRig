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

    private Long robotAId;
    private Long robotBId;
    private Long scriptAId;
    private Long scriptBId;
    private String winnerId;
    private int totalTurns;

    @Column(columnDefinition = "TEXT")
    private String battleLog;

    private LocalDateTime foughtAt;

    @PrePersist
    protected void onCreate() {
        this.foughtAt = LocalDateTime.now();
    }
}