package com.furnituree.furnituree.Controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.furnituree.furnituree.model.Wishlist;
import com.furnituree.furnituree.service.WishlistService;
import com.furnituree.furnituree.util.SecurityUtil;

@RestController
@RequestMapping("/api/v1/wishlist")
public class WishlistController {
    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public Wishlist get() {
        return wishlistService.getOrCreate(SecurityUtil.currentUsername());
    }

    @PostMapping("/products/{productId}")
    public Wishlist add(@PathVariable Long productId) {
        return wishlistService.add(SecurityUtil.currentUsername(), productId);
    }

    @DeleteMapping("/products/{productId}")
    public Wishlist remove(@PathVariable Long productId) {
        return wishlistService.remove(SecurityUtil.currentUsername(), productId);
    }
}
