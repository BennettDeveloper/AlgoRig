package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.CustomRobot;
import com.algorig.algorig_backend.model.enums.RobotTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomRobotRepository extends JpaRepository<CustomRobot, Long> {

    List<CustomRobot> findByUserId(Long userId);

    List<CustomRobot> findByUserIdAndTier(Long userId, RobotTier tier);

    Optional<CustomRobot> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndName(Long userId, String name);
}
