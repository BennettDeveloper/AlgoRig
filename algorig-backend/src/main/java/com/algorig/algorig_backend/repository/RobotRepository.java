package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.Robot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RobotRepository extends JpaRepository<Robot, Long> {
    List<Robot> findByTierLessThanEqual(int tier);
}