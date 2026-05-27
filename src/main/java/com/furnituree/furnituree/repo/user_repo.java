package com.furnituree.furnituree.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.User;

public interface user_repo extends JpaRepository<User, Long> {
    User findByUsername(String username);
    Optional<User> findOptionalByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findByRoleIgnoreCase(String role);
}
