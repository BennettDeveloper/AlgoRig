package com.algorig.algorig_backend.repository;

import com.algorig.algorig_backend.model.entity.Script;
import com.algorig.algorig_backend.model.entity.ScriptStats;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ScriptStatsRepository extends JpaRepository<ScriptStats, Long> {

    Optional<ScriptStats> findByScript(Script script);

    Optional<ScriptStats> findByScriptId(Long scriptId);

    // ── Leaderboard queries ───────────────────────────────────────────────────
    // Row layout: [0]=userId, [1]=username, [2]=avatarUrl,
    //             [3]=SUM(wins), [4]=SUM(totalBattles),
    //             [5]=us.wins, [6]=us.losses, [7]=us.draws,
    //             [8]=us.bestStreak, [9]=us.favoriteRobotId

    @Query(value = """
            SELECT s.owner.id, s.owner.username, s.owner.avatarUrl,
                   SUM(ss.wins), SUM(ss.totalBattles),
                   us.wins, us.losses, us.draws, us.bestStreak, us.favoriteRobotId
            FROM ScriptStats ss
            JOIN ss.script s
            LEFT JOIN UserStats us ON us.id = s.owner.id
            WHERE s.isPublic = true
            GROUP BY s.owner.id, s.owner.username, s.owner.avatarUrl,
                     us.wins, us.losses, us.draws, us.bestStreak, us.favoriteRobotId
            ORDER BY SUM(ss.wins) DESC, SUM(ss.totalBattles) DESC, s.owner.username ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT s.owner.id)
            FROM ScriptStats ss
            JOIN ss.script s
            WHERE s.isPublic = true
            """)
    Page<Object[]> findLeaderboardByTotalWins(Pageable pageable);

    @Query(value = """
            SELECT s.owner.id, s.owner.username, s.owner.avatarUrl,
                   SUM(ss.wins), SUM(ss.totalBattles),
                   us.wins, us.losses, us.draws, us.bestStreak, us.favoriteRobotId
            FROM ScriptStats ss
            JOIN ss.script s
            LEFT JOIN UserStats us ON us.id = s.owner.id
            WHERE s.isPublic = true
            GROUP BY s.owner.id, s.owner.username, s.owner.avatarUrl,
                     us.wins, us.losses, us.draws, us.bestStreak, us.favoriteRobotId
            HAVING SUM(ss.totalBattles) >= 10
            ORDER BY (CAST(SUM(ss.wins) AS double) / SUM(ss.totalBattles)) DESC,
                     SUM(ss.wins) DESC, s.owner.username ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT s.owner.id)
            FROM ScriptStats ss
            JOIN ss.script s
            WHERE s.isPublic = true
            """)
    Page<Object[]> findLeaderboardByWinRate(Pageable pageable);

    @Query(value = """
            SELECT s.owner.id, s.owner.username, s.owner.avatarUrl,
                   SUM(ss.wins), SUM(ss.totalBattles),
                   us.wins, us.losses, us.draws, us.bestStreak, us.favoriteRobotId
            FROM ScriptStats ss
            JOIN ss.script s
            LEFT JOIN UserStats us ON us.id = s.owner.id
            WHERE s.isPublic = true
            GROUP BY s.owner.id, s.owner.username, s.owner.avatarUrl,
                     us.wins, us.losses, us.draws, us.bestStreak, us.favoriteRobotId
            ORDER BY COALESCE(us.bestStreak, 0) DESC, SUM(ss.wins) DESC, s.owner.username ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT s.owner.id)
            FROM ScriptStats ss
            JOIN ss.script s
            WHERE s.isPublic = true
            """)
    Page<Object[]> findLeaderboardByBestStreak(Pageable pageable);
}
