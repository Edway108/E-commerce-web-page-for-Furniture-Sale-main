package com.furnituree.furnituree.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
