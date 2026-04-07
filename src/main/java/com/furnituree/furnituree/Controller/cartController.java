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
import com.furnituree.furnituree.model.Cart;
import com.furnituree.furnituree.model.CartItem;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.cartItem_repo;
import com.furnituree.furnituree.repo.cart_repo;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@RestController
@RequestMapping("/cart")
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

        // This section of code is responsible for adding a user's selected product to
        // their cart. Here's a breakdown of what it does:
        // 1.Find user name and connect it with the cart
        // cut out "Bearer "
        String token = header.substring(7);
        // "take username from tokpasswordEncoder"
        String username = JwtUtil.extractUsername(token);

        User user = usRepo.findByUsername(username);

        // find if user have cart or not , if not make one , if does use that one
        Cart cart = caRepo.findByUser(user);
        if (cart == null) {
            cart = new Cart();

            cart.setUser(user);

            caRepo.save(cart);

        }
        // find the product and the productid and quantity
        Long productId = req.getProductId();
        Long productQuantity = req.getProductQuantity();
        Product product = proRepo.findById(productId).orElse(null);
        if (product == null) {
            throw new RuntimeException("Product not found");
        }

        // make the cart item
        CartItem cartItem = caitemRepo.findByCartAndProduct(cart, product);

        if (cartItem != null) {
            cartItem.setQuantity(cartItem.getQuantity() + productQuantity);
        } else {
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(productQuantity);
            cartItem.setPrice(product.getPrice());
        }
        caitemRepo.save(cartItem);

        return cart;
    }

    @GetMapping("/getcart")
    public Cart getCart(@RequestHeader("Authorization") String header) {
        // 1.Find user name and connect it with the cart
        // cut out "Bearer "
        String token = header.substring(7);
        // "take username from tokpasswordEncoder"
        String username = JwtUtil.extractUsername(token);

        User user = usRepo.findByUsername(username);

        // find if user have cart or not , if not make one , if does use that one
        Cart cart = caRepo.findByUser(user);
        return cart;

    }

    @DeleteMapping("/{cartId}")
    public void deleteCart(@PathVariable Long cartId, @RequestHeader("Authorization") String header) {
        // Extract username from token
        String token = header.substring(7);
        String username = JwtUtil.extractUsername(token);

        User user = usRepo.findByUsername(username);

        // Find the cart by user and cartId
        Cart cart = caRepo.findByUser(user);
        if (cart == null || !cart.getCartId().equals(cartId)) {
            throw new RuntimeException("Cart not found or unauthorized access");
        }

        caRepo.delete(cart);
    }

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

}
