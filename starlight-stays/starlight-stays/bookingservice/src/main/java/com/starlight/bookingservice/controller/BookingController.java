package com.starlight.bookingservice.controller;

import com.starlight.bookingservice.dto.AvailabilityResponse;
import com.starlight.bookingservice.entity.Booking;
import com.starlight.bookingservice.security.JwtTokenParser;
import com.starlight.bookingservice.service.BookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final JwtTokenParser jwtTokenParser;

    public BookingController(BookingService bookingService, JwtTokenParser jwtTokenParser) {
        this.bookingService = bookingService;
        this.jwtTokenParser = jwtTokenParser;
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(
            @RequestBody Booking booking,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long userId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && userId != null) {
                if (booking.getUserId() != null && !booking.getUserId().equals(userId)) {
                    throw new SecurityException("You cannot create a booking for another user");
                }
                booking.setUserId(userId);
            }
        }

        return ResponseEntity.ok(bookingService.createBooking(booking));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long userId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && userId != null) {
                return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
            }
        }

        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Booking booking = bookingService.getBookingById(id);

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long userId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && userId != null) {
                if (!booking.getUserId().equals(userId)) {
                    throw new SecurityException("You are not authorized to view this booking");
                }
            }
        }

        return ResponseEntity.ok(booking);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getBookingsByUser(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            String role = jwtTokenParser.extractRole(authHeader);
            Long authUserId = jwtTokenParser.extractUserId(authHeader);
            if (!"ADMIN".equalsIgnoreCase(role) && authUserId != null) {
                if (!authUserId.equals(userId)) {
                    throw new SecurityException("You cannot view bookings of another user");
                }
            }
        }

        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Long requesterUserId = null;
        String requesterRole = null;

        if (authHeader != null && jwtTokenParser.isValid(authHeader)) {
            requesterRole = jwtTokenParser.extractRole(authHeader);
            requesterUserId = jwtTokenParser.extractUserId(authHeader);
        }

        return ResponseEntity.ok(bookingService.cancelBooking(id, requesterUserId, requesterRole));
    }

    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> checkAvailability(
            @RequestParam Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {

        return ResponseEntity.ok(bookingService.checkAvailability(roomId, checkIn, checkOut));
    }
}
