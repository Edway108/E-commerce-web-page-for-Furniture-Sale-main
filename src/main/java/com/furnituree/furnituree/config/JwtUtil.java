package com.furnituree.furnituree.config;

import java.security.Key;
import java.util.Date;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

public class JwtUtil {
    private static final byte[] SECRET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".getBytes();
    private static final Key key = Keys.hmacShaKeyFor(SECRET);
    private static final long EXPIRATION_MS = 24 * 60 * 60 * 1000L;

    public static String generateToken(String username) {
        return generateToken(username, "CUSTOMER");
    }

    public static String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    private static Claims getClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    public static String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public static String extractRole(String token) {
        Object role = getClaims(token).get("role");
        return role == null ? "CUSTOMER" : role.toString();
    }

    public static boolean isTokenValid(String token) {
        return !getClaims(token).getExpiration().before(new Date());
    }
}
