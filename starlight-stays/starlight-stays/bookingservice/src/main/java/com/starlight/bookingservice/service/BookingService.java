package com.starlight.bookingservice.service;

import com.starlight.bookingservice.dto.AvailabilityResponse;
import com.starlight.bookingservice.dto.PaymentRequest;
import com.starlight.bookingservice.dto.PaymentResponse;
import com.starlight.bookingservice.dto.RoomDTO;
import com.starlight.bookingservice.entity.Booking;
import com.starlight.bookingservice.entity.RoomLock;
import com.starlight.bookingservice.exception.ResourceNotFoundException;
import com.starlight.bookingservice.repository.BookingRepository;
import com.starlight.bookingservice.repository.RoomLockRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final RoomLockRepository roomLockRepository;
    private final RestClient restClient;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;
    private final ConcurrentHashMap<Long, Object> roomMonitors = new ConcurrentHashMap<>();

    public BookingService(BookingRepository bookingRepository,
                          RoomLockRepository roomLockRepository,
                          RestClient restClient) {
        this(bookingRepository, roomLockRepository, restClient, null, Clock.systemDefaultZone());
    }

    @Autowired
    public BookingService(BookingRepository bookingRepository,
                          RoomLockRepository roomLockRepository,
                          RestClient restClient,
                          @Autowired(required = false) PlatformTransactionManager transactionManager,
                          @Autowired(required = false) Clock clock) {
        this.bookingRepository = bookingRepository;
        this.roomLockRepository = roomLockRepository;
        this.restClient = restClient;
        this.transactionTemplate = transactionManager != null ? new TransactionTemplate(transactionManager) : null;
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    @PostConstruct
    public void initRoomLocks() {
        try {
            for (long id = 1; id <= 20; id++) {
                roomLockRepository.insertIfNotExists(id);
            }
            log.info("Successfully initialized base room locks (1-20)");
        } catch (Exception e) {
            log.warn("Notice: RoomLock pre-population encountered non-fatal condition: {}", e.getMessage());
        }
    }

    public void ensureRoomLockExists(Long roomId) {
        if (roomId == null) {
            return;
        }
        try {
            roomLockRepository.insertIfNotExists(roomId);
        } catch (Exception e) {
            log.debug("insertIfNotExists notice for room {}: {}", roomId, e.getMessage());
        }
    }

    public Booking createBooking(Booking booking) {
        validateReservationDates(booking.getCheckIn(), booking.getCheckOut());

        if (booking.getRoomId() == null) {
            throw new IllegalArgumentException("Room ID is required");
        }

        if (booking.getUserId() == null) {
            throw new IllegalArgumentException("User ID is required");
        }

        // 1. Call Room Service via Eureka service discovery
        RoomDTO room = fetchRoomFromService(booking.getRoomId());

        if ("MAINTENANCE".equalsIgnoreCase(room.getStatus())) {
            throw new RuntimeException("Room is currently under maintenance");
        }

        if ("INACTIVE".equalsIgnoreCase(room.getStatus())) {
            throw new RuntimeException("Room is currently inactive");
        }

        if (!"AVAILABLE".equalsIgnoreCase(room.getStatus())) {
            throw new RuntimeException("Room is not available (status: " + room.getStatus() + ")");
        }

        // Calculate total amount safely using BigDecimal based on nights and room price
        long nights = ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
        if (room.getPrice() != null) {
            BigDecimal pricePerNight = BigDecimal.valueOf(room.getPrice());
            BigDecimal totalAmount = pricePerNight.multiply(BigDecimal.valueOf(nights));
            booking.setTotalAmount(totalAmount.doubleValue());
        } else if (booking.getTotalAmount() == null) {
            throw new IllegalArgumentException("Total amount is required");
        }

        // Concurrency safeguard: ensure lock row exists, acquire JVM monitor and database row-level pessimistic lock
        ensureRoomLockExists(booking.getRoomId());
        Object roomMonitor = roomMonitors.computeIfAbsent(booking.getRoomId(), k -> new Object());
        Booking savedBooking;

        synchronized (roomMonitor) {
            if (transactionTemplate != null) {
                savedBooking = transactionTemplate.execute(status -> doReservePending(booking));
            } else {
                savedBooking = doReservePending(booking);
            }
        }

        // 4. Call Payment Service via Eureka service discovery
        String paymentMethod = booking.getPaymentMethod();
        if (paymentMethod == null || paymentMethod.isBlank()) {
            paymentMethod = "CARD";
        }

        BigDecimal amount = BigDecimal.valueOf(savedBooking.getTotalAmount());
        PaymentRequest paymentRequest = new PaymentRequest(
                savedBooking.getId(),
                savedBooking.getUserId(),
                amount,
                paymentMethod
        );

        PaymentResponse paymentResponse;
        try {
            paymentResponse = restClient.post()
                    .uri("http://PAYMENT-SERVICE/api/payments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(paymentRequest)
                    .retrieve()
                    .body(PaymentResponse.class);
        } catch (Exception e) {
            savedBooking.setStatus("FAILED");
            bookingRepository.save(savedBooking);
            throw new RuntimeException("Payment Service is unavailable or failed: " + e.getMessage());
        }

        // 5. If payment succeeds, update booking to CONFIRMED
        if (paymentResponse != null && "SUCCESS".equalsIgnoreCase(paymentResponse.getStatus())) {
            savedBooking.setStatus("CONFIRMED");
            savedBooking.setPayment(paymentResponse);
            return bookingRepository.save(savedBooking);
        } else {
            savedBooking.setStatus("FAILED");
            if (paymentResponse != null) {
                savedBooking.setPayment(paymentResponse);
            }
            bookingRepository.save(savedBooking);
            String failureReason = paymentResponse != null ? paymentResponse.getStatus() : "UNKNOWN";
            throw new RuntimeException("Payment was not successful (status: " + failureReason + ")");
        }
    }

    public AvailabilityResponse checkAvailability(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        try {
            validateReservationDates(checkIn, checkOut);
        } catch (Exception e) {
            return new AvailabilityResponse(roomId, checkIn, checkOut, false, e.getMessage());
        }

        RoomDTO room;
        try {
            room = fetchRoomFromService(roomId);
        } catch (Exception e) {
            return new AvailabilityResponse(roomId, checkIn, checkOut, false, e.getMessage());
        }

        if (!"AVAILABLE".equalsIgnoreCase(room.getStatus())) {
            return new AvailabilityResponse(roomId, checkIn, checkOut, false, "Room is currently " + room.getStatus().toLowerCase());
        }

        List<Booking> activeBookings = bookingRepository.findByRoomIdAndStatusIn(
                roomId,
                List.of("CONFIRMED", "PENDING")
        );

        for (Booking existing : activeBookings) {
            boolean overlap = checkIn.isBefore(existing.getCheckOut()) && checkOut.isAfter(existing.getCheckIn());
            if (overlap) {
                return new AvailabilityResponse(roomId, checkIn, checkOut, false, "Room is already booked for the selected dates");
            }
        }

        return new AvailabilityResponse(roomId, checkIn, checkOut, true, "Room is available for the selected dates");
    }

    public Booking getBookingById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Booking ID cannot be null");
        }
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + id));
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByUser(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return bookingRepository.findByUserId(userId);
    }

    public Booking cancelBooking(Long id) {
        return cancelBooking(id, null, null);
    }

    public Booking cancelBooking(Long id, Long requesterUserId, String requesterRole) {
        Booking booking = getBookingById(id);

        if (requesterUserId != null && !"ADMIN".equalsIgnoreCase(requesterRole)) {
            if (!booking.getUserId().equals(requesterUserId)) {
                throw new SecurityException("You are not authorized to cancel this booking");
            }
        }

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Booking is already cancelled");
        }

        if ("FAILED".equalsIgnoreCase(booking.getStatus())) {
            throw new RuntimeException("Cannot cancel a failed booking");
        }

        boolean wasConfirmed = "CONFIRMED".equalsIgnoreCase(booking.getStatus());
        booking.setStatus("CANCELLED");
        Booking savedBooking = bookingRepository.save(booking);

        // Refund associated payment if booking was confirmed
        if (wasConfirmed) {
            refundPaymentForBooking(id);
        }

        return savedBooking;
    }

    private void refundPaymentForBooking(Long bookingId) {
        try {
            List<PaymentResponse> payments = restClient.get()
                    .uri("http://PAYMENT-SERVICE/api/payments/booking/{bookingId}", bookingId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<PaymentResponse>>() {});

            if (payments != null) {
                for (PaymentResponse payment : payments) {
                    if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
                        restClient.put()
                                .uri("http://PAYMENT-SERVICE/api/payments/{id}/refund", payment.getId())
                                .retrieve()
                                .toBodilessEntity();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: could not process automatic refund for booking " + bookingId + ": " + e.getMessage());
        }
    }

    private Booking doReservePending(Booking booking) {
        // 1. Acquire pessimistic write lock on the room lock row
        RoomLock lock = roomLockRepository.findByRoomIdForUpdate(booking.getRoomId())
                .orElseGet(() -> {
                    RoomLock created = new RoomLock(booking.getRoomId(), LocalDateTime.now(clock));
                    try {
                        RoomLock saved = roomLockRepository.save(created);
                        return saved != null ? saved : created;
                    } catch (Exception e) {
                        return created;
                    }
                });

        if (lock != null) {
            lock.setLastLockedAt(LocalDateTime.now(clock));
            try {
                roomLockRepository.save(lock);
            } catch (Exception ignored) {
            }
        }

        // 2. Check for overlapping bookings [checkIn, checkOut)
        List<Booking> activeBookings = bookingRepository.findByRoomIdAndStatusIn(
                booking.getRoomId(),
                List.of("CONFIRMED", "PENDING")
        );

        for (Booking existing : activeBookings) {
            boolean overlap = booking.getCheckIn().isBefore(existing.getCheckOut()) &&
                    booking.getCheckOut().isAfter(existing.getCheckIn());

            if (overlap) {
                throw new RuntimeException("Room is already booked for the selected dates");
            }
        }

        // 3. Persist booking with initial PENDING status
        booking.setStatus("PENDING");
        return bookingRepository.save(booking);
    }

    private void validateReservationDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new RuntimeException("Check-in and check-out dates are required");
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new RuntimeException("Check-out must be after check-in");
        }

        LocalDate today = LocalDate.now(clock);
        if (!checkIn.isAfter(today)) {
            throw new RuntimeException("Check-in date must be strictly in the future (after " + today + ")");
        }
    }

    private RoomDTO fetchRoomFromService(Long roomId) {
        try {
            RoomDTO room = restClient.get()
                    .uri("http://ROOM-SERVICE/api/rooms/{id}", roomId)
                    .retrieve()
                    .body(RoomDTO.class);

            if (room == null) {
                throw new ResourceNotFoundException("Room not found with ID: " + roomId);
            }
            return room;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404 ||
                    (e.getResponseBodyAsString() != null && e.getResponseBodyAsString().contains("not found"))) {
                throw new ResourceNotFoundException("Room not found with ID: " + roomId);
            }
            throw new RuntimeException("Room Service error: " + e.getMessage());
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Room Service is unavailable: " + e.getMessage());
        }
    }
}
