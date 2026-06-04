package com.algorig.algorig_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "script_update_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptUpdateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_id", nullable = false)
    @ToString.Exclude
    private Script script;

    @Column(nullable = false)
    private int version;

    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt;

    @PrePersist
    void prePersist() {
        savedAt = LocalDateTime.now();
    }
}
