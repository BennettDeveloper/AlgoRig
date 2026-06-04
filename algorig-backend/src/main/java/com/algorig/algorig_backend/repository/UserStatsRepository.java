package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.User;
import com.algorig.algorig_backend.model.entity.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserStatsRepository extends JpaRepository<UserStats, Long> {

    Optional<UserStats> findByUser(User user);

    Optional<UserStats> findByUserId(Long userId);
}
