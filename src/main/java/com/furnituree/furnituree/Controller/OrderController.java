package com.furnituree.furnituree.Controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.furnituree.furnituree.dto.CheckoutRequest;
import com.furnituree.furnituree.dto.StatusRequest;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Order;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.OrderRepository;
import com.furnituree.furnituree.repo.user_repo;
import com.furnituree.furnituree.service.OrderService;
import com.furnituree.furnituree.util.SecurityUtil;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final user_repo userRepository;

    public OrderController(OrderRepository orderRepository, OrderService orderService, user_repo userRepository) {
        this.orderRepository = orderRepository;
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @PostMapping("/checkout")
    public Order checkout(@Valid @RequestBody CheckoutRequest request) {
        return orderService.checkout(SecurityUtil.currentUsername(), request);
    }

    @GetMapping("/my")
    public List<Order> myOrders() {
        User user = userRepository.findOptionalByUsername(SecurityUtil.currentUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<Order> all() {
        return orderRepository.findAll();
    }

    @GetMapping("/{id}")
    public Order one(@PathVariable Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Order updateStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return orderService.updateStatus(id, request);
    }
}
