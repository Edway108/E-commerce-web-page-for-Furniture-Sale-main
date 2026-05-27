package com.furnituree.furnituree.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.Order;
import com.furnituree.furnituree.model.User;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    List<Order> findByStatusIgnoreCase(String status);
}
