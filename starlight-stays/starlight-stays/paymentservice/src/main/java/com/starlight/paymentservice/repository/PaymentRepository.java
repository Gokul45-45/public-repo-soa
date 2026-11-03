package com.starlight.paymentservice.repository;

import com.starlight.paymentservice.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository
        extends JpaRepository<Payment, Long> {

    List<Payment> findByBookingId(Long bookingId);

    List<Payment> findByUserId(Long userId);

    Optional<Payment> findByTransactionId(
            String transactionId);
}
