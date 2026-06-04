package com.algorig.algorig_backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BattleService.generateBattleCode() via reflection.
 *
 * These tests were written AFTER a production incident where VARCHAR(13)
 * was too short for the 18-character format BATTLE-XXXXX-XXXXX.
 * battleCode_hasCorrectLength() would have caught that bug before deploy.
 */
class BattleCodeTest {

    private Method generateBattleCode;
    private BattleService battleService;

    @BeforeEach
    void setUp() throws Exception {
        // BattleService has 8 required-arg dependencies via @RequiredArgsConstructor.
        // generateBattleCode() uses only static constants; all deps can be null.
        battleService = new BattleService(null, null, null, null, null, null, null, null);

        generateBattleCode = BattleService.class.getDeclaredMethod("generateBattleCode");
        generateBattleCode.setAccessible(true);
    }

    private String generate() throws Exception {
        return (String) generateBattleCode.invoke(battleService);
    }

    // -------------------------------------------------------------------------
    // Format correctness
    // -------------------------------------------------------------------------

    @Test
    void battleCode_hasCorrectLength() throws Exception {
        // BATTLE-XXXXX-XXXXX: 7 + 5 + 1 + 5 = 18 characters
        // THIS TEST WOULD HAVE CAUGHT THE VARCHAR(13) PRODUCTION BUG
        assertEquals(18, generate().length());
    }

    @Test
    void battleCode_startsWithBattlePrefix() throws Exception {
        assertTrue(generate().startsWith("BATTLE-"));
    }

    @Test
    void battleCode_hasCorrectFormat() throws Exception {
        String code = generate();
        assertTrue(code.startsWith("BATTLE-"),
                "Must start with BATTLE-");
        assertEquals(18, code.length(),
                "Total length must be 18 (BATTLE-XXXXX-XXXXX)");
    }

    @Test
    void battleCode_hasDashInCorrectPositions() throws Exception {
        String code = generate();
        // "BATTLE-" occupies positions 0-6, dash at index 6
        assertEquals('-', code.charAt(6),
                "Dash after BATTLE prefix must be at index 6");
        // 5 random chars occupy 7-11, dash at index 12
        assertEquals('-', code.charAt(12),
                "Middle separator dash must be at index 12");
    }

    @Test
    void battleCode_fiveCharsInEachGroup() throws Exception {
        String code = generate();
        String[] parts = code.split("-");
        assertEquals(3, parts.length, "Must split into exactly 3 parts on '-'");
        assertEquals("BATTLE", parts[0]);
        assertEquals(5, parts[1].length(), "First random group must be 5 chars");
        assertEquals(5, parts[2].length(), "Second random group must be 5 chars");
    }

    // -------------------------------------------------------------------------
    // Alphabet correctness
    // -------------------------------------------------------------------------

    @Test
    void battleCode_containsOnlyValidCharacters() throws Exception {
        // Valid chars: BATTLE_ALPHABET plus the two dashes in the fixed prefix
        String valid = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789-";
        String code = generate();
        for (char c : code.toCharArray()) {
            assertTrue(valid.indexOf(c) >= 0,
                    "Invalid character in battle code: '" + c + "' in " + code);
        }
    }

    @Test
    void battleCode_doesNotContainAmbiguousCharacters() throws Exception {
        // Run 50 generations to increase confidence across the random space
        for (int i = 0; i < 50; i++) {
            String code = generate();
            // Strip the fixed "BATTLE-" prefix before checking random sections
            String randomPart = code.substring(7).replace("-", "");
            assertFalse(randomPart.contains("O"), "O is ambiguous with 0 — must be excluded");
            assertFalse(randomPart.contains("0"), "0 is ambiguous with O — must be excluded");
            assertFalse(randomPart.contains("I"), "I is ambiguous with 1 — must be excluded");
            assertFalse(randomPart.contains("1"), "1 is ambiguous with I — must be excluded");
        }
    }

    // -------------------------------------------------------------------------
    // DB constraint compliance
    // -------------------------------------------------------------------------

    @Test
    void battleCode_fitsInVarchar20() throws Exception {
        // Column is VARCHAR(20). 18-char codes must never exceed this.
        String code = generate();
        assertTrue(code.length() <= 20,
                "Battle code exceeds VARCHAR(20) limit: length=" + code.length() + " code=" + code);
    }

    // -------------------------------------------------------------------------
    // Uniqueness
    // -------------------------------------------------------------------------

    @Test
    void battleCode_isUnique_across100Generations() throws Exception {
        // With 32^10 ≈ 10^15 possible codes, collision is astronomically rare.
        // This test detects defects in the RNG or alphabet that reduce the keyspace.
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 100; i++) {
            String code = generate();
            assertTrue(seen.add(code),
                    "Duplicate battle code generated on iteration " + i + ": " + code);
        }
    }
}
