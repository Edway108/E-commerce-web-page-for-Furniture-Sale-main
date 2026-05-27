package com.furnituree.furnituree.Controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.furnituree.furnituree.config.JwtUtil;
import com.furnituree.furnituree.dto.addToCartRequest;
<<<<<<< HEAD
import com.furnituree.furnituree.dto.deleteFromCart;
import com.furnituree.furnituree.exception.BusinessException;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
=======
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)
import com.furnituree.furnituree.model.Cart;
import com.furnituree.furnituree.model.CartItem;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.cartItem_repo;
import com.furnituree.furnituree.repo.cart_repo;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@RestController
<<<<<<< HEAD
@RequestMapping({"/cart", "/api/v1/cart"})
=======
@RequestMapping("/cart")
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)
public class cartController {
    private final user_repo usRepo;
    private final cart_repo caRepo;
    private final product_repo proRepo;
    private final cartItem_repo caitemRepo;

    public cartController(user_repo usRepo, cart_repo caRepo, product_repo proRepo, cartItem_repo caitemRepo) {
        this.caRepo = caRepo;
        this.usRepo = usRepo;
        this.proRepo = proRepo;
        this.caitemRepo = caitemRepo;
    }

    @PostMapping("/addcart")
    public Cart addToCart(@RequestHeader("Authorization") String header, @RequestBody addToCartRequest req) {
        User user = currentUser(header);
        Cart cart = caRepo.findByUser(user);
        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            caRepo.save(cart);
        }
        Product product = proRepo.findById(req.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        long quantity = req.getProductQuantity() == null ? 1L : req.getProductQuantity();
        if (quantity <= 0) throw new BusinessException("Quantity must be greater than zero");
        if (!product.isActive() || !"ACTIVE".equalsIgnoreCase(product.getStatus())) throw new BusinessException("Product is not available");
        if (product.getQuantity() < quantity) throw new BusinessException("Not enough stock");

<<<<<<< HEAD
=======
        // make the cart item
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)
        CartItem cartItem = caitemRepo.findByCartAndProduct(cart, product);
        if (cartItem != null) {
            long newQuantity = cartItem.getQuantity() + quantity;
            if (product.getQuantity() < newQuantity) throw new BusinessException("Not enough stock");
            cartItem.setQuantity(newQuantity);
        } else {
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cartItem.setPrice(product.getPrice());
        }
        caitemRepo.save(cartItem);
        return caRepo.findById(cart.getCartId()).orElse(cart);
    }

    @GetMapping("/getcart")
    public Cart getCart(@RequestHeader("Authorization") String header) {
        return caRepo.findByUser(currentUser(header));
    }

    @DeleteMapping("/{cartId}")
    public void deleteCart(@PathVariable Long cartId, @RequestHeader("Authorization") String header) {
        User user = currentUser(header);
        Cart cart = caRepo.findByUser(user);
        if (cart == null || !cart.getCartId().equals(cartId)) {
            throw new ResourceNotFoundException("Cart not found or unauthorized access");
        }
        caRepo.delete(cart);
    }

<<<<<<< HEAD
    @DeleteMapping("/item")
    public Cart deleteFromCart(@RequestHeader("Authorization") String header, @RequestBody deleteFromCart req) {
        return removeProductFromCart(header, req.getProductId());
    }

    @DeleteMapping("/item/{productId}")
    public Cart deleteItemByProductId(@RequestHeader("Authorization") String header, @PathVariable Long productId) {
        return removeProductFromCart(header, productId);
    }

    private Cart removeProductFromCart(String header, Long productId) {
        if (productId == null) {
            throw new BusinessException("Product id is required");
        }

        User user = currentUser(header);
        Cart cart = caRepo.findByUser(user);
        if (cart == null) {
            throw new ResourceNotFoundException("Cart not found");
        }

        int deletedRows = caitemRepo.deleteByCartIdAndProductId(cart.getCartId(), productId);
        if (deletedRows == 0) {
            throw new ResourceNotFoundException("Item not found in cart");
        }

        Cart refreshedCart = caRepo.findByUser(user);
        if (refreshedCart != null && refreshedCart.getCartItems() != null) {
            refreshedCart.getCartItems().removeIf(item ->
                    item.getProduct() != null && item.getProduct().getId().equals(productId));
        }
        return refreshedCart;
    }

    private User currentUser(String header) {
        String token = header == null ? "" : header.replace("Bearer ", "");
        String username = JwtUtil.extractUsername(token);
        User user = usRepo.findByUsername(username);
        if (user == null) throw new ResourceNotFoundException("User not found");
        return user;
    }
=======
    // @DeleteMapping("/item/{cartItemId}")
    // public void deleteCartItem(@PathVariable Long cartItemId,
    // @RequestHeader("Authorization") String header) {
    // // Extract username from token
    // String token = header.substring(7);
    // String username = JwtUtil.extractUsername(token);
    // User user = usRepo.findByUsername(username);

    // // Find the cart by user and cartId
    // CartItem cartItem = caitemRepo.findById(cartItemId)
    // .orElseThrow(() -> new RuntimeException("CartItem not found"));

    // caitemRepo.delete(cartItem);

>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)
}
