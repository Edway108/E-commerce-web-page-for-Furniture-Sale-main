package com.furnituree.furnituree.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.furnituree.furnituree.model.Product;

public interface product_repo extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByproductNameContaining(String keyword);

    long countByCategoryId(Long categoryId);
}
