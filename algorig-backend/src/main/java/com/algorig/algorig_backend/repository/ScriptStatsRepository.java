package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.ScriptStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScriptStatsRepository extends JpaRepository<ScriptStats, Long> {

    Optional<ScriptStats> findByScript(Script script);

    Optional<ScriptStats> findByScriptId(Long scriptId);
}
