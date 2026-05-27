package com.furnituree.furnituree.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "cart")
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartId;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

<<<<<<< HEAD
    @OneToMany(mappedBy = "cart", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> cartItems = new ArrayList<>();
=======
    // one to many relationship ; which one cart could have many item
    // and mapped by for it said " hey i got cart in cart id so no need to make
    // collumn here"
    @OneToMany(mappedBy = "cart")
    private List<CartItem> cartItems;
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

<<<<<<< HEAD
    public Long getCartId() { return cartId; }
    public void setCartId(Long cartId) { this.cartId = cartId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public List<CartItem> getCartItems() { return cartItems; }
    public void setCartItems(List<CartItem> cartItems) { this.cartItems = cartItems; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
=======
    public void setCartId(Long cartId) {
        this.cartId = cartId;
    }

    public User getUser() {
        return user;

    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<CartItem> getcartItems() {
        return cartItems;
    }

    public void setItems(List<CartItem> cartItems) {
        this.cartItems = cartItems;
    }
>>>>>>> parent of 353f624 (feat: Implement delete item functionality in cart and enhance cart management)
}
