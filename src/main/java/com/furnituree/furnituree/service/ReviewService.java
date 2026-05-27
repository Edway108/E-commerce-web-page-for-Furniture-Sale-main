package com.furnituree.furnituree.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.furnituree.furnituree.dto.ReviewRequest;
import com.furnituree.furnituree.dto.StatusRequest;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.Review;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.ReviewRepository;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final product_repo productRepository;
    private final user_repo userRepository;
    private final AuditService auditService;

    public ReviewService(ReviewRepository reviewRepository, product_repo productRepository,
                         user_repo userRepository, AuditService auditService) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public Review create(String username, ReviewRequest request) {
        User user = userRepository.findOptionalByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setStatus("PENDING");
        Review saved = reviewRepository.save(review);
        auditService.record("CREATE", "Review", saved.getId(), "Review submitted for moderation");
        return saved;
    }

    @Transactional
    public Review moderate(Long id, StatusRequest request) {
        Review review = reviewRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setStatus(request.getStatus().toUpperCase());
        auditService.record("MODERATE", "Review", id, "Review status changed to " + review.getStatus());
        return reviewRepository.save(review);
    }
}
