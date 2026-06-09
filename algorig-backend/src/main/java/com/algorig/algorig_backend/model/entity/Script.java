package com.algorig.algorig_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "scripts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Script {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String content;

    private int version;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    @ToString.Exclude
    private User owner;

    @Column(name = "is_public", nullable = false)
    @ColumnDefault("true")
    @Builder.Default
    private boolean isPublic = true;

    @Column(name = "featured_order")
    private Integer featuredOrder;

    @Column(name = "required_tiers", columnDefinition = "TEXT")
    private String requiredTiers;

    public List<String> getRequiredTiersList() {
        if (requiredTiers == null || requiredTiers.isBlank()) return Collections.emptyList();
        return Arrays.asList(requiredTiers.split(","));
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.version = 1;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        this.version++;
    }
}
