package com.algorig.algorig_backend.util;

import com.algorig.algorig_backend.model.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    // Same secret as application-test.properties — 43-byte payload, well above HS256 minimum
    private static final String TEST_SECRET =
            "dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3ItYWxnb3JpZy11bml0LXRlc3Rpbmcx";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 86400000L);
    }

    // -------------------------------------------------------------------------
    // Generation
    // -------------------------------------------------------------------------

    @Test
    void generateToken_producesNonNullToken() {
        String token = jwtUtil.generateToken(buildTestUser(1L, "testuser", "test@test.com"));
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void generateToken_doesNotStartWithBearerPrefix() {
        // "Bearer " prefix is added by the HTTP filter, not by JwtUtil itself
        String token = jwtUtil.generateToken(buildTestUser(1L, "user", "u@test.com"));
        assertFalse(token.startsWith("Bearer "),
                "Token should be a raw JWT, not prefixed with 'Bearer '");
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    @Test
    void validateToken_returnsTrueForValidToken() {
        String token = jwtUtil.generateToken(buildTestUser(1L, "testuser", "test@test.com"));
        assertTrue(jwtUtil.validateToken(token));
    }

    @Test
    void validateToken_returnsFalseForTamperedSignature() {
        String token = jwtUtil.generateToken(buildTestUser(1L, "testuser", "test@test.com"));
        // Replace the last 3 characters of the signature segment
        String tampered = token.substring(0, token.length() - 3) + "xxx";
        assertFalse(jwtUtil.validateToken(tampered));
    }

    @Test
    void validateToken_returnsFalseForEmptyString() {
        assertFalse(jwtUtil.validateToken(""));
    }

    @Test
    void validateToken_returnsFalseForGibberish() {
        assertFalse(jwtUtil.validateToken("not.a.jwt"));
    }

    @Test
    void validateToken_returnsFalseForTokenSignedWithDifferentSecret() {
        // Token signed with a different key must not validate against our key
        JwtUtil otherUtil = new JwtUtil();
        // Different but valid Base64 key
        ReflectionTestUtils.setField(otherUtil, "jwtSecret",
                "ZGlmZmVyZW50LXNlY3JldC1rZXktZm9yLXRlc3Rpbmctb25seS0xMjM0NTY=");
        ReflectionTestUtils.setField(otherUtil, "jwtExpirationMs", 86400000L);

        String foreignToken = otherUtil.generateToken(buildTestUser(99L, "other", "other@test.com"));
        assertFalse(jwtUtil.validateToken(foreignToken));
    }

    // -------------------------------------------------------------------------
    // Claim extraction
    // -------------------------------------------------------------------------

    @Test
    void extractUserId_returnsCorrectId() {
        User user = buildTestUser(42L, "user42", "u@u.com");
        String token = jwtUtil.generateToken(user);
        assertEquals(42L, jwtUtil.extractUserId(token));
    }

    @Test
    void extractEmail_returnsCorrectEmail() {
        User user = buildTestUser(1L, "someuser", "hello@test.com");
        String token = jwtUtil.generateToken(user);
        assertEquals("hello@test.com", jwtUtil.extractEmail(token));
    }

    @Test
    void generateToken_roundTrip_userIdAndEmailSurvive() {
        // Single test confirming the full generate → extract roundtrip for both claims
        User user = buildTestUser(7L, "roundtrip", "roundtrip@example.com");
        String token = jwtUtil.generateToken(user);
        assertTrue(jwtUtil.validateToken(token));
        assertEquals(7L, jwtUtil.extractUserId(token));
        assertEquals("roundtrip@example.com", jwtUtil.extractEmail(token));
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private User buildTestUser(Long id, String username, String email) {
        return User.builder()
                .id(id)
                .username(username)
                .email(email)
                .provider("local")
                .passwordHash("hash")
                .build();
    }
}
