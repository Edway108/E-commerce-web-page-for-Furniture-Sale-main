package com.furnituree.furnituree.Controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.furnituree.furnituree.repo.CategoryRepository;
import com.furnituree.furnituree.repo.OrderRepository;
import com.furnituree.furnituree.repo.ReviewRepository;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class DashboardController {
    private final user_repo userRepository;
    private final product_repo productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    public DashboardController(user_repo userRepository, product_repo productRepository,
                               CategoryRepository categoryRepository, OrderRepository orderRepository,
                               ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalUsers", userRepository.count());
        data.put("totalProducts", productRepository.count());
        data.put("totalCategories", categoryRepository.count());
        data.put("totalOrders", orderRepository.count());
        data.put("pendingOrders", orderRepository.findByStatusIgnoreCase("PENDING").size());
        data.put("lowStockProducts", productRepository.findLowStockProducts().size());
        data.put("pendingReviews", reviewRepository.findByStatusIgnoreCase("PENDING").size());
        return data;
    }
}
