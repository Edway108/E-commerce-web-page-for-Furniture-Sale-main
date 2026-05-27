package com.furnituree.furnituree.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductAndStatusIgnoreCase(Product product, String status);
    List<Review> findByStatusIgnoreCase(String status);
}
