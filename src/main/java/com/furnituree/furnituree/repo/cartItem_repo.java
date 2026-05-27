package com.furnituree.furnituree.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.furnituree.furnituree.model.Cart;
import com.furnituree.furnituree.model.CartItem;
import com.furnituree.furnituree.model.Product;

public interface cartItem_repo extends JpaRepository<CartItem, Long> {
    CartItem findByCartAndProduct(Cart cart, Product product);
    CartItem findByCart(Cart cart);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("DELETE FROM CartItem ci WHERE ci.cart.cartId = :cartId AND ci.product.id = :productId")
    int deleteByCartIdAndProductId(@Param("cartId") Long cartId, @Param("productId") Long productId);
}
