package com.furnituree.furnituree.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.Category;

public interface category_repo extends JpaRepository<Category, Long> {
    Optional<Category> findByNameIgnoreCase(String name);

    List<Category> findByNameContainingIgnoreCaseOrderByNameAsc(String keyword);

    boolean existsByNameIgnoreCase(String name);
}
