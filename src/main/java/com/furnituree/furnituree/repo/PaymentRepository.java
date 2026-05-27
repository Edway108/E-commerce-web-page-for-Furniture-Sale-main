package com.furnituree.furnituree.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
}
