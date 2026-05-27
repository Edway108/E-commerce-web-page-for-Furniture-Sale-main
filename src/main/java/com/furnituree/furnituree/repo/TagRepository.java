package com.furnituree.furnituree.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.Tag;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByNameIgnoreCase(String name);
}
