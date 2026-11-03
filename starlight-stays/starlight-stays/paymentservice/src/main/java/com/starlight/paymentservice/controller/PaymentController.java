package com.starlight.paymentservice.controller;

import com.starlight.paymentservice.entity.Payment;
import com.starlight.paymentservice.security.JwtTokenParser;
import com.starlight.paymentservice.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final JwtTokenParser jwtTokenParser;

    public PaymentController(PaymentService paymentService, JwtTokenParser jwtTokenParser) {
        this.paymentService = paymentService;
        this.jwtTokenParser = jwtTokenParser;
    }

    @PostMapping
    public ResponseEntity<Payment> createPayment(
            @RequestBody Payment payment,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long userId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && userId != null) {
                if (payment.getUserId() != null && !payment.getUserId().equals(userId)) {
                    throw new SecurityException("You cannot create a payment for another user");
                }
                payment.setUserId(userId);
            }
        }

        return ResponseEntity.ok(paymentService.createPayment(payment));
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long userId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && userId != null) {
                return ResponseEntity.ok(paymentService.getPaymentsByUser(userId));
            }
        }

        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Payment payment = paymentService.getPaymentById(id);

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long userId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && userId != null) {
                if (!payment.getUserId().equals(userId)) {
                    throw new SecurityException("You are not authorized to view this payment");
                }
            }
        }

        return ResponseEntity.ok(payment);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Payment>> getPaymentsByBooking(
            @PathVariable Long bookingId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        List<Payment> payments = paymentService.getPaymentsByBooking(bookingId);

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long userId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && userId != null && !payments.isEmpty()) {
                if (!payments.get(0).getUserId().equals(userId)) {
                    throw new SecurityException("You are not authorized to view payments for this booking");
                }
            }
        }

        return ResponseEntity.ok(payments);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Payment>> getPaymentsByUser(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long authUserId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && authUserId != null) {
                if (!authUserId.equals(userId)) {
                    throw new SecurityException("You cannot view payments of another user");
                }
            }
        }

        return ResponseEntity.ok(paymentService.getPaymentsByUser(userId));
    }

    @PutMapping("/{id}/refund")
    public ResponseEntity<Payment> refundPayment(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        return ResponseEntity.ok(paymentService.refundPayment(id));
    }
}
