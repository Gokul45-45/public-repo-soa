package com.starlight.paymentservice.service;

import com.starlight.paymentservice.entity.Payment;
import com.starlight.paymentservice.exception.ResourceNotFoundException;
import com.starlight.paymentservice.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Payment createPayment(Payment payment) {
        if (payment.getBookingId() == null) {
            throw new IllegalArgumentException("Booking ID is required");
        }

        if (payment.getUserId() == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        if (payment.getPaymentMethod() == null || payment.getPaymentMethod().isBlank()) {
            throw new IllegalArgumentException("Payment method is required");
        }

        // Generate unique transaction ID
        payment.setTransactionId(UUID.randomUUID().toString());
        payment.setPaymentDate(LocalDateTime.now());
        payment.setStatus("PENDING");

        Payment savedPayment = paymentRepository.save(payment);

        // Simulate payment processing
        savedPayment.setStatus(simulatePaymentProcessing());

        return paymentRepository.save(savedPayment);
    }

    public Payment getPaymentById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Payment ID cannot be null");
        }
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + id));
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public List<Payment> getPaymentsByBooking(Long bookingId) {
        if (bookingId == null) {
            throw new IllegalArgumentException("Booking ID cannot be null");
        }
        return paymentRepository.findByBookingId(bookingId);
    }

    public List<Payment> getPaymentsByUser(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return paymentRepository.findByUserId(userId);
    }

    public Payment refundPayment(Long id) {
        Payment payment = getPaymentById(id);

        if ("REFUNDED".equalsIgnoreCase(payment.getStatus())) {
            throw new RuntimeException("Payment is already refunded");
        }

        if (!"SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            throw new RuntimeException("Only successful payments can be refunded");
        }

        payment.setStatus("REFUNDED");
        return paymentRepository.save(payment);
    }

    private String simulatePaymentProcessing() {
        return "SUCCESS";
    }
}
