package com.furnituree.furnituree.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.model.Wishlist;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    Optional<Wishlist> findByUser(User user);
}
