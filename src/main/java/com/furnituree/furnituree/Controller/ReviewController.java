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

import com.furnituree.furnituree.dto.ReviewRequest;
import com.furnituree.furnituree.dto.StatusRequest;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.Review;
import com.furnituree.furnituree.repo.ReviewRepository;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.service.ReviewService;
import com.furnituree.furnituree.util.SecurityUtil;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {
    private final ReviewRepository reviewRepository;
    private final product_repo productRepository;
    private final ReviewService reviewService;

    public ReviewController(ReviewRepository reviewRepository, product_repo productRepository, ReviewService reviewService) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.reviewService = reviewService;
    }

    @PostMapping
    public Review create(@Valid @RequestBody ReviewRequest request) {
        return reviewService.create(SecurityUtil.currentUsername(), request);
    }

    @GetMapping("/products/{productId}")
    public List<Review> approvedForProduct(@PathVariable Long productId) {
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return reviewRepository.findByProductAndStatusIgnoreCase(product, "APPROVED");
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public List<Review> pending() {
        return reviewRepository.findByStatusIgnoreCase("PENDING");
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Review moderate(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return reviewService.moderate(id, request);
    }
}
