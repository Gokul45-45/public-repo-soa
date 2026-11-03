package com.starlight.userservice;

import com.starlight.userservice.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private static final String SECRET = "StarlightStaySecretKeyForJWT2026VerySecure";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET);
    }

    @Test
    @DisplayName("Should generate valid token containing email, role, and userId")
    void testGenerateAndExtractClaims() {
        String token = jwtUtil.generateToken(2L, "alice@starlight.com", "CUSTOMER");

        assertNotNull(token);
        assertTrue(jwtUtil.isValid(token));
        assertEquals("alice@starlight.com", jwtUtil.extractEmail(token));
        assertEquals("CUSTOMER", jwtUtil.extractRole(token));
        assertEquals(2L, jwtUtil.extractUserId(token));
    }

    @Test
    @DisplayName("Should reject expired token")
    void testExpiredToken() {
        String expiredToken = jwtUtil.generateExpiredToken("alice@starlight.com", "CUSTOMER");

        assertNotNull(expiredToken);
        assertFalse(jwtUtil.isValid(expiredToken));
    }

    @Test
    @DisplayName("Should reject tampered token")
    void testTamperedToken() {
        String validToken = jwtUtil.generateToken(2L, "alice@starlight.com", "CUSTOMER");
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "xyz12";

        assertFalse(jwtUtil.isValid(tamperedToken));
    }

    @Test
    @DisplayName("Should reject completely invalid or malformed token string")
    void testMalformedToken() {
        assertFalse(jwtUtil.isValid("not-a-valid-jwt-token"));
        assertFalse(jwtUtil.isValid(""));
        assertFalse(jwtUtil.isValid(null));
    }
}
