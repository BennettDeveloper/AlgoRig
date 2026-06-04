package com.algorig.algorig_backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "script_required_robots",
        joinColumns = @JoinColumn(name = "script_id"),
        inverseJoinColumns = @JoinColumn(name = "robot_id")
    )
    @Builder.Default
    @ToString.Exclude
    private Set<Robot> requiredRobots = new HashSet<>();

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
