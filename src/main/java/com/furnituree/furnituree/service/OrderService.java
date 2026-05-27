package com.furnituree.furnituree.service;

import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.furnituree.furnituree.dto.CheckoutRequest;
import com.furnituree.furnituree.dto.StatusRequest;
import com.furnituree.furnituree.exception.BusinessException;
import com.furnituree.furnituree.exception.ResourceNotFoundException;
import com.furnituree.furnituree.model.Cart;
import com.furnituree.furnituree.model.CartItem;
import com.furnituree.furnituree.model.Order;
import com.furnituree.furnituree.model.OrderItem;
import com.furnituree.furnituree.model.Payment;
import com.furnituree.furnituree.model.Product;
import com.furnituree.furnituree.model.User;
import com.furnituree.furnituree.repo.OrderRepository;
import com.furnituree.furnituree.repo.cart_repo;
import com.furnituree.furnituree.repo.product_repo;
import com.furnituree.furnituree.repo.user_repo;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final cart_repo cartRepository;
    private final product_repo productRepository;
    private final user_repo userRepository;
    private final AuditService auditService;

    public OrderService(OrderRepository orderRepository, cart_repo cartRepository, product_repo productRepository,
                        user_repo userRepository, AuditService auditService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public Order checkout(String username, CheckoutRequest request) {
        User user = userRepository.findOptionalByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Cart cart = cartRepository.findOptionalByUser(user)
                .orElseThrow(() -> new BusinessException("Cart is empty"));
        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new BusinessException("Cart is empty");
        }

        Order order = new Order();
        order.setOrderCode("ORD-" + System.currentTimeMillis());
        order.setUser(user);
        order.setShippingAddress(request.getShippingAddress());
        order.setReceiverPhone(request.getReceiverPhone());
        order.setNote(request.getNote());

        double subtotal = 0.0;
        for (CartItem cartItem : cart.getCartItems()) {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            if (!product.isActive() || !"ACTIVE".equalsIgnoreCase(product.getStatus())) {
                throw new BusinessException(product.getProductName() + " is not available");
            }
            if (product.getQuantity() < cartItem.getQuantity()) {
                throw new BusinessException("Not enough stock for " + product.getProductName());
            }
            product.setQuantity(product.getQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setProductNameSnapshot(product.getProductName());
            item.setQuantity(cartItem.getQuantity());
            item.setUnitPrice(product.getPrice());
            item.setLineTotal(product.getPrice() * cartItem.getQuantity());
            subtotal += item.getLineTotal();
            order.getItems().add(item);
        }

        double discount = subtotal >= 2000 ? subtotal * 0.05 : 0.0;
        double tax = (subtotal - discount) * 0.08;
        double shippingFee = subtotal >= 1000 ? 0.0 : 40.0;
        order.setSubtotal(round(subtotal));
        order.setDiscount(round(discount));
        order.setTax(round(tax));
        order.setShippingFee(round(shippingFee));
        order.setTotal(round(subtotal - discount + tax + shippingFee));

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setMethod(request.getPaymentMethod() == null ? "COD" : request.getPaymentMethod());
        payment.setStatus("COD".equalsIgnoreCase(payment.getMethod()) ? "UNPAID" : "PENDING");
        payment.setAmount(order.getTotal());
        order.setPayment(payment);

        Order saved = orderRepository.save(order);
        cartRepository.delete(cart);
        auditService.record("CHECKOUT", "Order", saved.getId(), "Order placed from cart");
        return saved;
    }

    @Transactional
    public Order updateStatus(Long id, StatusRequest request) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        String newStatus = request.getStatus().toUpperCase(Locale.ROOT).trim();
        validateTransition(order.getStatus(), newStatus);
        order.setStatus(newStatus);
        LocalDateTime now = LocalDateTime.now();
        if ("CONFIRMED".equals(newStatus)) order.setConfirmedAt(now);
        if ("SHIPPED".equals(newStatus)) order.setShippedAt(now);
        if ("COMPLETED".equals(newStatus)) order.setCompletedAt(now);
        if ("CANCELLED".equals(newStatus)) {
            order.setCancelledAt(now);
            restoreStock(order);
        }
        auditService.record("CHANGE_STATUS", "Order", id, "Status changed to " + newStatus);
        return orderRepository.save(order);
    }

    private void validateTransition(String current, String next) {
        String c = current == null ? "PENDING" : current.toUpperCase(Locale.ROOT);
        if ("COMPLETED".equals(c) || "CANCELLED".equals(c)) {
            throw new BusinessException("Completed or cancelled orders cannot be changed");
        }
        boolean valid = switch (c) {
            case "PENDING" -> next.equals("CONFIRMED") || next.equals("CANCELLED");
            case "CONFIRMED" -> next.equals("SHIPPED") || next.equals("CANCELLED");
            case "SHIPPED" -> next.equals("COMPLETED");
            default -> false;
        };
        if (!valid) {
            throw new BusinessException("Invalid order status transition from " + current + " to " + next);
        }
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setQuantity(product.getQuantity() + item.getQuantity());
            productRepository.save(product);
        }
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
