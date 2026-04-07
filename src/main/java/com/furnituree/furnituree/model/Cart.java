package com.furnituree.furnituree.model;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;

@Entity
public class Cart {

    @Id // make this one be unique and make it PK easier to query
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartId;

    @OneToOne // one user which could have one collumn;connected by user_id (what a wrong way
              // to name entity)
    @JoinColumn(name = "user_id") // make this one FK refferencing to the user_id ( make a collumn in this table
                                  // to )
    private User user;// just name it user

    // one to many relationship ; which one cart could have many item
    // and mapped by for it said " hey i got cart in cart id so no need to make
    // collumn here"
    @OneToMany(mappedBy = "cart")
    private List<CartItem> cartItems;

    // getter and setter
    public Long getCartId() {
        return cartId;

    }

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
}
