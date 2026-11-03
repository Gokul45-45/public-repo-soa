package com.starlight.bookingservice;

import com.starlight.bookingservice.controller.BookingController;
import com.starlight.bookingservice.controller.GlobalExceptionHandler;
import com.starlight.bookingservice.dto.AvailabilityResponse;
import com.starlight.bookingservice.entity.Booking;
import com.starlight.bookingservice.exception.ResourceNotFoundException;
import com.starlight.bookingservice.security.JwtTokenParser;
import com.starlight.bookingservice.service.BookingService;
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

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock
    private BookingService bookingService;

    @Mock
    private JwtTokenParser jwtTokenParser;

    @InjectMocks
    private BookingController bookingController;

    private MockMvc mockMvc;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(bookingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        today = LocalDate.now();
    }

    @Test
    @DisplayName("POST /api/bookings returns 200 with confirmed booking")
    void testCreateBooking() throws Exception {
        Booking booking = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CONFIRMED");
        when(bookingService.createBooking(any(Booking.class))).thenReturn(booking);

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":2,\"roomId\":1,\"checkIn\":\"" + today.plusDays(1) + "\",\"checkOut\":\"" + today.plusDays(6) + "\",\"totalAmount\":17500.0,\"paymentMethod\":\"CARD\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.totalAmount").value(17500.0));
    }

    @Test
    @DisplayName("POST /api/bookings overlapping booking returns 400 Bad Request with message")
    void testCreateBooking_OverlapReturnsBadRequest() throws Exception {
        when(bookingService.createBooking(any(Booking.class)))
                .thenThrow(new RuntimeException("Room is already booked for the selected dates"));

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":2,\"roomId\":1,\"checkIn\":\"" + today.plusDays(2) + "\",\"checkOut\":\"" + today.plusDays(4) + "\",\"totalAmount\":7000.0,\"paymentMethod\":\"UPI\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Room is already booked for the selected dates"));
    }

    @Test
    @DisplayName("GET /api/bookings/availability returns availability status")
    void testCheckAvailabilityEndpoint() throws Exception {
        AvailabilityResponse resp = new AvailabilityResponse(1L, today.plusDays(1), today.plusDays(6), true, "Room is available for the selected dates");
        when(bookingService.checkAvailability(eq(1L), any(LocalDate.class), any(LocalDate.class))).thenReturn(resp);

        mockMvc.perform(get("/api/bookings/availability?roomId=1&checkIn=" + today.plusDays(1) + "&checkOut=" + today.plusDays(6)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.message").value("Room is available for the selected dates"));
    }

    @Test
    @DisplayName("PUT /api/bookings/1/cancel cancels booking")
    void testCancelBookingEndpoint() throws Exception {
        Booking cancelled = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CANCELLED");
        when(bookingService.cancelBooking(eq(1L), any(), any())).thenReturn(cancelled);

        mockMvc.perform(put("/api/bookings/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("GET /api/bookings/999 not found returns 404")
    void testGetBookingNotFound() throws Exception {
        when(bookingService.getBookingById(999L)).thenThrow(new ResourceNotFoundException("Booking not found with ID: 999"));

        mockMvc.perform(get("/api/bookings/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Booking not found with ID: 999"));
    }

    @Test
    @DisplayName("GET /api/bookings/user/{userId} customer viewing another user's bookings returns 403 Forbidden")
    void testCustomerCannotViewAnotherUserBookings() throws Exception {
        String token = "Bearer customer.token.xyz";
        when(jwtTokenParser.isValid(token)).thenReturn(true);
        when(jwtTokenParser.extractRole(token)).thenReturn("CUSTOMER");
        when(jwtTokenParser.extractUserId(token)).thenReturn(2L);

        mockMvc.perform(get("/api/bookings/user/99")
                        .header("Authorization", token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You cannot view bookings of another user"));
    }

    @Test
    @DisplayName("GET /api/bookings/{id} customer viewing another user's booking returns 403 Forbidden")
    void testCustomerCannotViewAnotherUserBookingById() throws Exception {
        String token = "Bearer customer.token.xyz";
        Booking booking = new Booking(99L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CONFIRMED");

        when(bookingService.getBookingById(1L)).thenReturn(booking);
        when(jwtTokenParser.isValid(token)).thenReturn(true);
        when(jwtTokenParser.extractRole(token)).thenReturn("CUSTOMER");
        when(jwtTokenParser.extractUserId(token)).thenReturn(2L);

        mockMvc.perform(get("/api/bookings/1")
                        .header("Authorization", token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not authorized to view this booking"));
    }

    @Test
    @DisplayName("PUT /api/bookings/{id}/cancel unauthorized cancellation returns 403 Forbidden")
    void testUnauthorizedCancellationReturnsForbidden() throws Exception {
        String token = "Bearer customer.token.xyz";
        when(jwtTokenParser.isValid(token)).thenReturn(true);
        when(jwtTokenParser.extractRole(token)).thenReturn("CUSTOMER");
        when(jwtTokenParser.extractUserId(token)).thenReturn(2L);

        when(bookingService.cancelBooking(eq(1L), eq(2L), eq("CUSTOMER")))
                .thenThrow(new SecurityException("You are not authorized to cancel this booking"));

        mockMvc.perform(put("/api/bookings/1/cancel")
                        .header("Authorization", token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not authorized to cancel this booking"));
    }
}
