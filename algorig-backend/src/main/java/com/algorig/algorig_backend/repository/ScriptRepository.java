package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.Script;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScriptRepository extends JpaRepository<Script, Long> {
}