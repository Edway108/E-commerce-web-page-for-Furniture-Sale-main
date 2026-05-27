package com.furnituree.furnituree.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import com.furnituree.furnituree.model.Product;

public interface product_repo extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByProductNameContainingIgnoreCase(String keyword);
    List<Product> findByproductNameContaining(String keyword);

    @Query("select p from Product p where p.active = true and p.quantity <= p.stockThreshold")
    List<Product> findLowStockProducts();
}
