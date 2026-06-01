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
import com.furnituree.furnituree.dto.deleteFromCart;
import com.furnituree.furnituree.exception.BadRequestException;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
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
@SuppressWarnings("InitializerMayBeStatic")
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
        User user = getUserFromHeader(header);
        validateAddToCartRequest(req);

        Cart cart = caRepo.findByUser(user);
        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            caRepo.save(cart);
        }

        Product product = proRepo.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + req.getProductId()));

        Long requestedQuantity = req.getProductQuantity();
        long stock = product.getQuantity() == null ? 0 : product.getQuantity();
        if (stock <= 0) {
            throw new BadRequestException("Product is out of stock");
        }

        CartItem cartItem = caitemRepo.findByCartAndProduct(cart, product);
        long currentQuantity = cartItem == null ? 0 : cartItem.getQuantity();
        if (currentQuantity + requestedQuantity > stock) {
            throw new BadRequestException("Cannot add more than available stock. Available stock: " + stock);
        }

        if (cartItem != null) {
            cartItem.setQuantity(currentQuantity + requestedQuantity);
        } else {
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(requestedQuantity);
            cartItem.setPrice(product.getPrice());
        }
        caitemRepo.save(cartItem);

        return cart;
    }

    @GetMapping("/getcart")
    public Cart getCart(@RequestHeader("Authorization") String header) {
        User user = getUserFromHeader(header);
        return caRepo.findByUser(user);
    }

    @DeleteMapping("/{cartId}")
    public void deleteCart(@PathVariable Long cartId, @RequestHeader("Authorization") String header) {
        User user = getUserFromHeader(header);
        Cart cart = caRepo.findByUser(user);
        if (cart == null || !cart.getCartId().equals(cartId)) {
            throw new ResourceNotFoundException("Cart not found or unauthorized access");
        }

        caRepo.delete(cart);
    }

    @DeleteMapping("/item")
    public Cart deleteFromCart(@RequestHeader("Authorization") String header, @RequestBody deleteFromCart req) {
        User user = getUserFromHeader(header);
        if (req == null || req.getProductId() == null) {
            throw new BadRequestException("Product id is required");
        }

        Cart cart = caRepo.findByUser(user);
        if (cart == null) {
            throw new ResourceNotFoundException("Cart not found");
        }

        Product product = proRepo.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + req.getProductId()));

        CartItem cartItem = caitemRepo.findByCartAndProduct(cart, product);
        if (cartItem == null) {
            throw new ResourceNotFoundException("Item not found in cart");
        }

        caitemRepo.delete(cartItem);

        return caRepo.findById(cart.getCartId()).orElse(cart);
    }

    private User getUserFromHeader(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new BadRequestException("Authorization header is missing or invalid");
        }

        String token = header.substring(7);
        String username = JwtUtil.extractUsername(token);
        User user = usRepo.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found");
        }
        return user;
    }

    private void validateAddToCartRequest(addToCartRequest req) {
        if (req == null) {
            throw new BadRequestException("Request body is required");
        }
        if (req.getProductId() == null) {
            throw new BadRequestException("Product id is required");
        }
        if (req.getProductQuantity() == null || req.getProductQuantity() <= 0) {
            throw new BadRequestException("Product quantity must be greater than 0");
        }
    }
}
