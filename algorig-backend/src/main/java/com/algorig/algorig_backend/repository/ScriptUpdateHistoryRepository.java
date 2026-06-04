package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.ScriptUpdateHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScriptUpdateHistoryRepository extends JpaRepository<ScriptUpdateHistory, Long> {

    List<ScriptUpdateHistory> findByScriptOrderBySavedAtDesc(Script script);

    List<ScriptUpdateHistory> findByScriptIdOrderBySavedAtDesc(Long scriptId);
}
