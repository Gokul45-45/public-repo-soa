package com.starlight.paymentservice;

import com.starlight.paymentservice.controller.GlobalExceptionHandler;
import com.starlight.paymentservice.controller.PaymentController;
import com.starlight.paymentservice.entity.Payment;
import com.starlight.paymentservice.exception.ResourceNotFoundException;
import com.starlight.paymentservice.security.JwtTokenParser;
import com.starlight.paymentservice.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    @Mock
    private JwtTokenParser jwtTokenParser;

    @InjectMocks
    private PaymentController paymentController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/payments/booking/1 returns payments for booking")
    void testGetPaymentsByBooking() throws Exception {
        Payment payment = new Payment();
        payment.setBookingId(1L);
        payment.setUserId(2L);
        payment.setAmount(BigDecimal.valueOf(17500.0));
        payment.setStatus("SUCCESS");

        when(paymentService.getPaymentsByBooking(1L)).thenReturn(List.of(payment));

        mockMvc.perform(get("/api/payments/booking/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookingId").value(1))
                .andExpect(jsonPath("$[0].status").value("SUCCESS"));
    }

    @Test
    @DisplayName("PUT /api/payments/1/refund updates payment status to REFUNDED")
    void testRefundPayment() throws Exception {
        Payment refunded = new Payment();
        refunded.setBookingId(1L);
        refunded.setUserId(2L);
        refunded.setStatus("REFUNDED");

        when(paymentService.refundPayment(1L)).thenReturn(refunded);

        mockMvc.perform(put("/api/payments/1/refund"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REFUNDED"));
    }

    @Test
    @DisplayName("GET /api/payments/999 not found returns 404")
    void testGetPaymentNotFound() throws Exception {
        when(paymentService.getPaymentById(999L)).thenThrow(new ResourceNotFoundException("Payment not found with ID: 999"));

        mockMvc.perform(get("/api/payments/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Payment not found with ID: 999"));
    }

    @Test
    @DisplayName("GET /api/payments/user/{userId} customer viewing another user's payments should return 403 Forbidden")
    void testCustomerCannotViewAnotherUserPayments() throws Exception {
        String token = "Bearer customer.token.xyz";
        when(jwtTokenParser.isValid(token)).thenReturn(true);
        when(jwtTokenParser.extractRole(token)).thenReturn("CUSTOMER");
        when(jwtTokenParser.extractUserId(token)).thenReturn(2L);

        mockMvc.perform(get("/api/payments/user/99")
                        .header("Authorization", token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You cannot view payments of another user"));
    }

    @Test
    @DisplayName("GET /api/payments/{id} customer viewing another user's payment should return 403 Forbidden")
    void testCustomerCannotViewAnotherUserPaymentById() throws Exception {
        String token = "Bearer customer.token.xyz";
        Payment payment = new Payment();
        payment.setBookingId(10L);
        payment.setUserId(99L); // Belongs to user 99

        when(paymentService.getPaymentById(1L)).thenReturn(payment);
        when(jwtTokenParser.isValid(token)).thenReturn(true);
        when(jwtTokenParser.extractRole(token)).thenReturn("CUSTOMER");
        when(jwtTokenParser.extractUserId(token)).thenReturn(2L); // Authenticated as user 2

        mockMvc.perform(get("/api/payments/1")
                        .header("Authorization", token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not authorized to view this payment"));
    }
}
