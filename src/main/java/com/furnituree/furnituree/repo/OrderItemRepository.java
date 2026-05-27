package com.furnituree.furnituree.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
