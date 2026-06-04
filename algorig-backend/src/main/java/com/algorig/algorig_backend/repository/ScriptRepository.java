package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ScriptRepository extends JpaRepository<Script, Long> {

    List<Script> findByOwner(User owner);

    List<Script> findByOwnerAndIsPublic(User owner, boolean isPublic);

    List<Script> findByIsPublicTrue();

    Optional<Script> findByIdAndOwner(Long id, User owner);

    boolean existsByIdAndOwner(Long id, User owner);

    List<Script> findByOwnerAndFeaturedOrderIsNotNullOrderByFeaturedOrderAsc(User owner);

    long countByOwner(User owner);

    long countByIsPublicTrue();

    // Paginated public scripts — newest first (simple, no stats join needed)
    Page<Script> findByIsPublicTrueOrderByCreatedAtDesc(Pageable pageable);

    // Search by name among public scripts
    Page<Script> findByIsPublicTrueAndNameContainingIgnoreCase(
            String name, Pageable pageable);

    // ── Workshop browsing queries (filtered + sorted) ─────────────────────

    @Query(value = """
            SELECT s FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
            ORDER BY COALESCE(ss.timesUsed, 0) DESC, s.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(s) FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
            """)
    Page<Script> findPublicScriptsSortByMostUsed(
            @Param("search") String search,
            @Param("authorUsername") String authorUsername,
            @Param("minBattles") int minBattles,
            Pageable pageable);

    @Query(value = """
            SELECT s FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
            ORDER BY COALESCE(ss.winRate, 0) DESC, s.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(s) FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
            """)
    Page<Script> findPublicScriptsSortByWinRate(
            @Param("search") String search,
            @Param("authorUsername") String authorUsername,
            @Param("minBattles") int minBattles,
            Pageable pageable);

    @Query(value = """
            SELECT s FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
            ORDER BY s.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(s) FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
            """)
    Page<Script> findPublicScriptsSortByNewest(
            @Param("search") String search,
            @Param("authorUsername") String authorUsername,
            @Param("minBattles") int minBattles,
            Pageable pageable);

    // ── Filtered variants with hasRequirements support ────────────────────

    @Query(value = """
            SELECT s FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
              AND (:requirementsOnly = false OR s.requiredRobots IS NOT EMPTY)
            ORDER BY COALESCE(ss.timesUsed, 0) DESC, s.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(s) FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
              AND (:requirementsOnly = false OR s.requiredRobots IS NOT EMPTY)
            """)
    Page<Script> findPublicScriptsSortByMostUsedFiltered(
            @Param("search") String search,
            @Param("authorUsername") String authorUsername,
            @Param("minBattles") int minBattles,
            @Param("requirementsOnly") boolean requirementsOnly,
            Pageable pageable);

    @Query(value = """
            SELECT s FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
              AND (:requirementsOnly = false OR s.requiredRobots IS NOT EMPTY)
            ORDER BY COALESCE(ss.winRate, 0) DESC, s.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(s) FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
              AND (:requirementsOnly = false OR s.requiredRobots IS NOT EMPTY)
            """)
    Page<Script> findPublicScriptsSortByWinRateFiltered(
            @Param("search") String search,
            @Param("authorUsername") String authorUsername,
            @Param("minBattles") int minBattles,
            @Param("requirementsOnly") boolean requirementsOnly,
            Pageable pageable);

    @Query(value = """
            SELECT s FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
              AND (:requirementsOnly = false OR s.requiredRobots IS NOT EMPTY)
            ORDER BY s.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(s) FROM Script s
            LEFT JOIN ScriptStats ss ON ss.script = s
            LEFT JOIN s.owner o
            WHERE s.isPublic = true
              AND (:search IS NULL OR :search = ''
                   OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.username) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:authorUsername IS NULL OR :authorUsername = ''
                   OR LOWER(o.username) = LOWER(:authorUsername))
              AND (COALESCE(ss.totalBattles, 0) >= :minBattles)
              AND (:requirementsOnly = false OR s.requiredRobots IS NOT EMPTY)
            """)
    Page<Script> findPublicScriptsSortByNewestFiltered(
            @Param("search") String search,
            @Param("authorUsername") String authorUsername,
            @Param("minBattles") int minBattles,
            @Param("requirementsOnly") boolean requirementsOnly,
            Pageable pageable);
}
