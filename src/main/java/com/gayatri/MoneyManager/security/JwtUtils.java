package com.gayatri.MoneyManager.security;
/*
 * Loads secret key and token expiry time from configuration.
 * Converts secret string into a cryptographic key.
 * Generate token generateToken() creates JWT
 * Client sends JWT with each request isTokenValid() checks token
 * Extract email from token - extractEmail() gets user identity
 * Validate token - Request proceeds if token is valid
 *
 * */

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

import io.jsonwebtoken.security.Keys;
@Component
public class JwtUtils {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration; // milliseconds (86400000 = 24 hours)

    // Convert secret string into a cryptographic Key object
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // ── Generate a token for a user ──────────────────────────
    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)          // who this token is for
                .setIssuedAt(new Date())    // when issued
                .setExpiration(new Date(System.currentTimeMillis() + expiration)) // when it expires
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // sign it
                .compact();
    }

    // ── Extract email from token ─────────────────────────────
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject(); // this is the email we stored
    }

    // ── Check if token is still valid ────────────────────────
    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token); // throws if invalid/expired
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
