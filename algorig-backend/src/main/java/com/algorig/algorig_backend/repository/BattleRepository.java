package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.Battle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BattleRepository extends JpaRepository<Battle, Long> {
}