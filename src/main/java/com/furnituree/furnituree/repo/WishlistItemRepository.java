package com.furnituree.furnituree.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.Wishlist;
import com.furnituree.furnituree.model.WishlistItem;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    WishlistItem findByWishlistAndProduct(Wishlist wishlist, Product product);
}
