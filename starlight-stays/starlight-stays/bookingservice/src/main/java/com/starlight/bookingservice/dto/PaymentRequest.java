package com.starlight.bookingservice.dto;

import java.math.BigDecimal;

public class PaymentRequest {

    private Long bookingId;
    private Long userId;
    private BigDecimal amount;
    private String paymentMethod;

    public PaymentRequest() {
    }

    public PaymentRequest(Long bookingId, Long userId, BigDecimal amount, String paymentMethod) {
        this.bookingId = bookingId;
        this.userId = userId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
