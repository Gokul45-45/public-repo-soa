package com.starlight.paymentservice;

import com.starlight.paymentservice.entity.Payment;
import com.starlight.paymentservice.exception.ResourceNotFoundException;
import com.starlight.paymentservice.repository.PaymentRepository;
import com.starlight.paymentservice.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Payment samplePayment;

    @BeforeEach
    void setUp() {
        samplePayment = new Payment();
        samplePayment.setBookingId(1L);
        samplePayment.setUserId(2L);
        samplePayment.setAmount(BigDecimal.valueOf(17500.0));
        samplePayment.setPaymentMethod("CARD");
        samplePayment.setStatus("SUCCESS");
    }

    @Test
    @DisplayName("Should successfully process simulated payment")
    void testCreatePayment_Success() {
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment processed = paymentService.createPayment(samplePayment);

        assertNotNull(processed);
        assertEquals("SUCCESS", processed.getStatus());
        assertNotNull(processed.getTransactionId());
        assertNotNull(processed.getPaymentDate());
    }

    @Test
    @DisplayName("Should reject payment missing booking ID")
    void testCreatePayment_MissingBookingId() {
        samplePayment.setBookingId(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> paymentService.createPayment(samplePayment));
        assertTrue(ex.getMessage().contains("Booking ID is required"));
    }

    @Test
    @DisplayName("Should reject payment missing user ID")
    void testCreatePayment_MissingUserId() {
        samplePayment.setUserId(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> paymentService.createPayment(samplePayment));
        assertTrue(ex.getMessage().contains("User ID is required"));
    }

    @Test
    @DisplayName("Should reject payment with non-positive amount")
    void testCreatePayment_InvalidAmount() {
        samplePayment.setAmount(BigDecimal.ZERO);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> paymentService.createPayment(samplePayment));
        assertTrue(ex.getMessage().contains("Amount must be greater than zero"));
    }

    @Test
    @DisplayName("Should refund successful payment")
    void testRefundPayment_Success() {
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(samplePayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment refunded = paymentService.refundPayment(1L);

        assertEquals("REFUNDED", refunded.getStatus());
    }

    @Test
    @DisplayName("Should reject refund on already refunded payment (prevents duplicate refund)")
    void testRefundPayment_AlreadyRefunded() {
        samplePayment.setStatus("REFUNDED");
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(samplePayment));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> paymentService.refundPayment(1L));
        assertTrue(ex.getMessage().contains("already refunded"));
    }

    @Test
    @DisplayName("Should reject refund on non-success payment")
    void testRefundPayment_FailedPayment() {
        samplePayment.setStatus("FAILED");
        when(paymentRepository.findById(1L)).thenReturn(Optional.of(samplePayment));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> paymentService.refundPayment(1L));
        assertTrue(ex.getMessage().contains("Only successful payments can be refunded"));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for nonexistent payment ID")
    void testGetPaymentById_NotFound() {
        when(paymentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentService.getPaymentById(999L));
    }

    @Test
    @DisplayName("Should retrieve payments by booking ID")
    void testGetPaymentsByBooking() {
        when(paymentRepository.findByBookingId(1L)).thenReturn(List.of(samplePayment));

        List<Payment> payments = paymentService.getPaymentsByBooking(1L);

        assertEquals(1, payments.size());
    }
}
