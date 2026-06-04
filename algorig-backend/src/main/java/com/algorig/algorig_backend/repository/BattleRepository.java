package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.Battle;
import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BattleRepository extends JpaRepository<Battle, Long> {

    List<Battle> findByOwner(User owner);

    List<Battle> findByOwnerOrderByFoughtAtDesc(User owner);

    long countByOwner(User owner);

    long countByOwnerAndWinnerId(User owner, String winnerId);

    List<Battle> findTop5ByOwnerOrderByFoughtAtDesc(User owner);

    // Script-scoped queries for ScriptStats computation
    List<Battle> findByScriptA(Script script);

    List<Battle> findByScriptB(Script script);

    long countByScriptA(Script script);

    long countByScriptB(Script script);

    long countByScriptAAndWinnerId(Script script, String winnerId);

    long countByScriptBAndWinnerId(Script script, String winnerId);

    // Paginated battle history for a script (either slot) — used by /api/repository/{id}/battles
    Page<Battle> findByScriptAOrScriptBOrderByFoughtAtDesc(
            Script scriptA, Script scriptB, Pageable pageable);

    // All non-self battles for a script — used by difficulty computation
    @Query("""
        SELECT b FROM Battle b
        LEFT JOIN FETCH b.scriptA
        LEFT JOIN FETCH b.scriptB
        WHERE (b.scriptA = :script OR b.scriptB = :script)
        AND b.scriptA.id != b.scriptB.id
        """)
    List<Battle> findNonSelfBattlesForScript(
            @Param("script") Script script);

    // Non-self battles after statsSince — used when stats were reset
    @Query("""
        SELECT b FROM Battle b
        LEFT JOIN FETCH b.scriptA
        LEFT JOIN FETCH b.scriptB
        WHERE (b.scriptA = :script OR b.scriptB = :script)
        AND b.scriptA.id != b.scriptB.id
        AND b.foughtAt >= :statsSince
        """)
    List<Battle> findNonSelfBattlesForScriptSince(
            @Param("script") Script script,
            @Param("statsSince") LocalDateTime statsSince);
}
