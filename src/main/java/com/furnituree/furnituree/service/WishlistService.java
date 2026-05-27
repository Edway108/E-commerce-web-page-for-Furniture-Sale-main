package com.furnituree.furnituree.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.model.Wishlist;
import com.furnituree.furnituree.model.WishlistItem;
import com.furnituree.furnituree.repo.WishlistItemRepository;
import com.furnituree.furnituree.repo.WishlistRepository;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@Service
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final product_repo productRepository;
    private final user_repo userRepository;
    private final AuditService auditService;

    public WishlistService(WishlistRepository wishlistRepository, WishlistItemRepository wishlistItemRepository,
                           product_repo productRepository, user_repo userRepository, AuditService auditService) {
        this.wishlistRepository = wishlistRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public Wishlist getOrCreate(String username) {
        User user = userRepository.findOptionalByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return wishlistRepository.findByUser(user).orElseGet(() -> {
            Wishlist wishlist = new Wishlist();
            wishlist.setUser(user);
            return wishlistRepository.save(wishlist);
        });
    }

    @Transactional
    public Wishlist add(String username, Long productId) {
        Wishlist wishlist = getOrCreate(username);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        WishlistItem existing = wishlistItemRepository.findByWishlistAndProduct(wishlist, product);
        if (existing == null) {
            WishlistItem item = new WishlistItem();
            item.setWishlist(wishlist);
            item.setProduct(product);
            wishlist.getItems().add(item);
            wishlistRepository.save(wishlist);
            auditService.record("ADD", "WishlistItem", productId, "Product added to wishlist");
        }
        return getOrCreate(username);
    }

    @Transactional
    public Wishlist remove(String username, Long productId) {
        Wishlist wishlist = getOrCreate(username);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        WishlistItem existing = wishlistItemRepository.findByWishlistAndProduct(wishlist, product);
        if (existing != null) {
            wishlistItemRepository.delete(existing);
            auditService.record("REMOVE", "WishlistItem", productId, "Product removed from wishlist");
        }
        return getOrCreate(username);
    }
}
