package com.starlight.bookingservice;

import com.starlight.bookingservice.dto.AvailabilityResponse;
import com.starlight.bookingservice.dto.PaymentRequest;
import com.starlight.bookingservice.dto.PaymentResponse;
import com.starlight.bookingservice.dto.RoomDTO;
import com.starlight.bookingservice.entity.Booking;
import com.starlight.bookingservice.entity.RoomLock;
import com.starlight.bookingservice.exception.ResourceNotFoundException;
import com.starlight.bookingservice.repository.BookingRepository;
import com.starlight.bookingservice.repository.RoomLockRepository;
import com.starlight.bookingservice.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RoomLockRepository roomLockRepository;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @Mock
    private RestClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private RestClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private RestClient.RequestBodySpec requestBodySpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private BookingService bookingService;

    private RoomDTO sampleRoom;
    private Booking sampleBooking;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(bookingRepository, roomLockRepository, restClient);
        today = LocalDate.now();

        sampleRoom = new RoomDTO(1L, 1L, "101", "DELUXE", 2, 3500.0, "AVAILABLE");

        sampleBooking = new Booking();
        sampleBooking.setRoomId(1L);
        sampleBooking.setUserId(2L);
        sampleBooking.setCheckIn(today.plusDays(1));
        sampleBooking.setCheckOut(today.plusDays(6));
        sampleBooking.setPaymentMethod("CARD");

        lenient().when(roomLockRepository.findByRoomIdForUpdate(anyLong()))
                .thenAnswer(inv -> Optional.of(new RoomLock(inv.getArgument(0), LocalDateTime.now())));
        lenient().when(roomLockRepository.save(any(RoomLock.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private void mockRoomServiceCall(RoomDTO room) {
        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(eq("http://ROOM-SERVICE/api/rooms/{id}"), eq(room.getId())))
                .thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(RoomDTO.class)).thenReturn(room);
    }

    private void mockPaymentServiceCall(String status) {
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(eq("http://PAYMENT-SERVICE/api/payments"))).thenReturn(requestBodySpec);
        when(requestBodySpec.contentType(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any(PaymentRequest.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);

        PaymentResponse paymentResponse = new PaymentResponse(
                1L, 1L, 2L, BigDecimal.valueOf(17500.0), "CARD", "tx-123", status
        );
        when(responseSpec.body(PaymentResponse.class)).thenReturn(paymentResponse);
    }

    @Test
    @DisplayName("Should successfully create booking and calculate total correctly (5 nights * 3500 = 17500)")
    void testCreateBooking_Success() {
        mockRoomServiceCall(sampleRoom);
        mockPaymentServiceCall("SUCCESS");

        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            if (b.getId() == null) {
                b = new Booking(b.getUserId(), b.getRoomId(), b.getCheckIn(), b.getCheckOut(), b.getTotalAmount(), b.getStatus());
                ReflectionTestUtils.setField(b, "id", 1L);
            }
            return b;
        });

        Booking result = bookingService.createBooking(sampleBooking);

        assertNotNull(result);
        assertEquals("CONFIRMED", result.getStatus());
        assertEquals(17500.0, result.getTotalAmount());
        assertNotNull(result.getPayment());
        assertEquals("SUCCESS", result.getPayment().getStatus());
    }

    @Test
    @DisplayName("Should reject booking when check-in date is missing")
    void testCreateBooking_MissingCheckIn() {
        sampleBooking.setCheckIn(null);
        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertTrue(ex.getMessage().contains("Check-in and check-out dates are required"));
    }

    @Test
    @DisplayName("Should reject booking when check-out equals check-in")
    void testCreateBooking_CheckOutEqualsCheckIn() {
        sampleBooking.setCheckOut(sampleBooking.getCheckIn());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertTrue(ex.getMessage().contains("Check-out must be after check-in"));
    }

    @Test
    @DisplayName("Should reject booking when check-out is before check-in")
    void testCreateBooking_CheckOutBeforeCheckIn() {
        sampleBooking.setCheckOut(sampleBooking.getCheckIn().minusDays(1));
        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertTrue(ex.getMessage().contains("Check-out must be after check-in"));
    }

    @Test
    @DisplayName("Should reject booking when check-in is in the past relative to actual current date")
    void testCreateBooking_PastCheckIn() {
        sampleBooking.setCheckIn(today.minusDays(5));
        sampleBooking.setCheckOut(today.plusDays(2));
        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertTrue(ex.getMessage().contains("Check-in date must be strictly in the future"));
    }

    @Test
    @DisplayName("Should reject booking when room is in MAINTENANCE status")
    void testCreateBooking_RoomInMaintenance() {
        sampleRoom.setStatus("MAINTENANCE");
        mockRoomServiceCall(sampleRoom);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertTrue(ex.getMessage().contains("Room is currently under maintenance"));
    }

    @Test
    @DisplayName("Should reject booking when room is in INACTIVE status")
    void testCreateBooking_RoomInactive() {
        sampleRoom.setStatus("INACTIVE");
        mockRoomServiceCall(sampleRoom);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertTrue(ex.getMessage().contains("Room is currently inactive"));
    }

    @Test
    @DisplayName("Should reject overlapping reservation (inside range)")
    void testCreateBooking_OverlapInside() {
        mockRoomServiceCall(sampleRoom);

        Booking existing = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CONFIRMED");
        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenReturn(List.of(existing));

        // New booking overlaps inside
        sampleBooking.setCheckIn(today.plusDays(2));
        sampleBooking.setCheckOut(today.plusDays(4));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertEquals("Room is already booked for the selected dates", ex.getMessage());
    }

    @Test
    @DisplayName("Should reject overlapping reservation (starts before, ends inside)")
    void testCreateBooking_OverlapStart() {
        mockRoomServiceCall(sampleRoom);

        Booking existing = new Booking(2L, 1L, today.plusDays(3), today.plusDays(8), 17500.0, "CONFIRMED");
        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenReturn(List.of(existing));

        sampleBooking.setCheckIn(today.plusDays(2));
        sampleBooking.setCheckOut(today.plusDays(5));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertEquals("Room is already booked for the selected dates", ex.getMessage());
    }

    @Test
    @DisplayName("Should accept adjacent reservation (checkout date equals checkin date)")
    void testCreateBooking_AdjacentAccepted() {
        mockRoomServiceCall(sampleRoom);
        mockPaymentServiceCall("SUCCESS");

        Booking existing = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CONFIRMED");
        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenReturn(List.of(existing));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // New booking starts exactly when existing checkout happens
        sampleBooking.setCheckIn(today.plusDays(6));
        sampleBooking.setCheckOut(today.plusDays(10));

        Booking result = bookingService.createBooking(sampleBooking);
        assertNotNull(result);
        assertEquals("CONFIRMED", result.getStatus());
    }

    @Test
    @DisplayName("Should record FAILED status when payment service fails without falsely confirming")
    void testCreateBooking_PaymentFailure() {
        mockRoomServiceCall(sampleRoom);
        mockPaymentServiceCall("FAILED");

        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(sampleBooking));
        assertTrue(ex.getMessage().contains("Payment was not successful"));
    }

    @Test
    @DisplayName("Should successfully cancel confirmed booking and update status to CANCELLED")
    void testCancelBooking_Success() {
        Booking booking = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CONFIRMED");
        ReflectionTestUtils.setField(booking, "id", 1L);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking cancelled = bookingService.cancelBooking(1L, 2L, "CUSTOMER");

        assertEquals("CANCELLED", cancelled.getStatus());
    }

    @Test
    @DisplayName("Should reject repeated cancellation of already cancelled booking")
    void testCancelBooking_AlreadyCancelled() {
        Booking booking = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CANCELLED");
        ReflectionTestUtils.setField(booking, "id", 1L);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.cancelBooking(1L, 2L, "CUSTOMER"));
        assertEquals("Booking is already cancelled", ex.getMessage());
    }

    @Test
    @DisplayName("Should reject cancellation by unauthorized customer")
    void testCancelBooking_Unauthorized() {
        Booking booking = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CONFIRMED");
        ReflectionTestUtils.setField(booking, "id", 1L);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        SecurityException ex = assertThrows(SecurityException.class, () -> bookingService.cancelBooking(1L, 99L, "CUSTOMER"));
        assertTrue(ex.getMessage().contains("not authorized"));
    }

    @Test
    @DisplayName("Check availability should return available for free dates")
    void testCheckAvailability_Available() {
        mockRoomServiceCall(sampleRoom);
        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenReturn(List.of());

        AvailabilityResponse response = bookingService.checkAvailability(1L, today.plusDays(1), today.plusDays(6));

        assertTrue(response.isAvailable());
        assertEquals("Room is available for the selected dates", response.getMessage());
    }

    @Test
    @DisplayName("Check availability should return not available for overlapping dates")
    void testCheckAvailability_Overlap() {
        mockRoomServiceCall(sampleRoom);
        Booking existing = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, "CONFIRMED");
        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenReturn(List.of(existing));

        AvailabilityResponse response = bookingService.checkAvailability(1L, today.plusDays(2), today.plusDays(4));

        assertFalse(response.isAvailable());
        assertEquals("Room is already booked for the selected dates", response.getMessage());
    }

    @Test
    @DisplayName("Concurrent booking requests for the same room and date range should not both succeed")
    void testConcurrentBookings_OnlyOneSucceeds() throws Exception {
        mockRoomServiceCall(sampleRoom);
        mockPaymentServiceCall("SUCCESS");

        CopyOnWriteArrayList<Booking> sharedBookings = new CopyOnWriteArrayList<>();

        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenAnswer(inv -> List.copyOf(sharedBookings));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            sharedBookings.add(b);
            return b;
        });

        int numThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CyclicBarrier barrier = new CyclicBarrier(numThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        List<Callable<Void>> tasks = List.of(
                () -> {
                    barrier.await();
                    Booking b1 = new Booking(2L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, null);
                    try {
                        bookingService.createBooking(b1);
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        failureCount.incrementAndGet();
                    }
                    return null;
                },
                () -> {
                    barrier.await();
                    Booking b2 = new Booking(3L, 1L, today.plusDays(1), today.plusDays(6), 17500.0, null);
                    try {
                        bookingService.createBooking(b2);
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        failureCount.incrementAndGet();
                    }
                    return null;
                }
        );

        List<Future<Void>> futures = executor.invokeAll(tasks);
        for (Future<Void> f : futures) {
            f.get();
        }
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one booking must succeed");
        assertEquals(1, failureCount.get(), "The concurrent booking must fail due to overlap");
    }

    @Test
    @DisplayName("Controlled Clock: yesterday check-in must be rejected")
    void testValidateCheckIn_Yesterday_Rejected() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-10-27T12:00:00Z"), ZoneId.of("UTC"));
        BookingService serviceWithClock = new BookingService(bookingRepository, roomLockRepository, restClient, null, fixedClock);

        LocalDate fixedToday = LocalDate.now(fixedClock); // 2026-10-27
        Booking booking = new Booking(2L, 1L, fixedToday.minusDays(1), fixedToday.plusDays(3), 10500.0, null);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> serviceWithClock.createBooking(booking));
        assertTrue(ex.getMessage().contains("Check-in date must be strictly in the future"));
    }

    @Test
    @DisplayName("Controlled Clock: today check-in must be rejected")
    void testValidateCheckIn_Today_Rejected() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-10-27T12:00:00Z"), ZoneId.of("UTC"));
        BookingService serviceWithClock = new BookingService(bookingRepository, roomLockRepository, restClient, null, fixedClock);

        LocalDate fixedToday = LocalDate.now(fixedClock); // 2026-10-27
        Booking booking = new Booking(2L, 1L, fixedToday, fixedToday.plusDays(3), 10500.0, null);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> serviceWithClock.createBooking(booking));
        assertTrue(ex.getMessage().contains("Check-in date must be strictly in the future"));
    }

    @Test
    @DisplayName("Controlled Clock: tomorrow check-in must be accepted")
    void testValidateCheckIn_Tomorrow_Accepted() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-10-27T12:00:00Z"), ZoneId.of("UTC"));
        BookingService serviceWithClock = new BookingService(bookingRepository, roomLockRepository, restClient, null, fixedClock);

        LocalDate fixedToday = LocalDate.now(fixedClock); // 2026-10-27
        Booking booking = new Booking(2L, 1L, fixedToday.plusDays(1), fixedToday.plusDays(3), 7000.0, "CARD");

        mockRoomServiceCall(sampleRoom);
        mockPaymentServiceCall("SUCCESS");
        when(bookingRepository.findByRoomIdAndStatusIn(eq(1L), anyList())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking result = serviceWithClock.createBooking(booking);
        assertNotNull(result);
        assertEquals("CONFIRMED", result.getStatus());
    }

    @Test
    @DisplayName("Room ID > 20: ensureRoomLockExists creates lock row and booking succeeds")
    void testCreateBooking_RoomIdGreaterThan20_EnsuresLockRowAndSucceeds() {
        Long roomId25 = 25L;
        RoomDTO room25 = new RoomDTO(25L, 2L, "205", "SUITE", 4, 5000.0, "AVAILABLE");
        mockRoomServiceCall(room25);
        mockPaymentServiceCall("SUCCESS");

        Booking bookingRoom25 = new Booking(2L, roomId25, today.plusDays(2), today.plusDays(5), 15000.0, "CARD");

        when(roomLockRepository.findByRoomIdForUpdate(eq(25L))).thenReturn(Optional.of(new RoomLock(25L, null)));
        when(bookingRepository.findByRoomIdAndStatusIn(eq(25L), anyList())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking result = bookingService.createBooking(bookingRoom25);

        assertNotNull(result);
        assertEquals("CONFIRMED", result.getStatus());
        verify(roomLockRepository, atLeastOnce()).insertIfNotExists(eq(25L));
        verify(roomLockRepository, atLeastOnce()).findByRoomIdForUpdate(eq(25L));
    }

    @Test
    @DisplayName("Concurrent booking requests for Room ID > 20: lock prevents double booking")
    void testConcurrentBookings_RoomIdGreaterThan20_SimultaneousRequests() throws Exception {
        Long roomId25 = 25L;
        RoomDTO room25 = new RoomDTO(25L, 2L, "205", "SUITE", 4, 5000.0, "AVAILABLE");
        mockRoomServiceCall(room25);
        mockPaymentServiceCall("SUCCESS");

        CopyOnWriteArrayList<Booking> sharedBookings = new CopyOnWriteArrayList<>();

        when(roomLockRepository.findByRoomIdForUpdate(eq(25L)))
                .thenReturn(Optional.of(new RoomLock(25L, null)));
        when(bookingRepository.findByRoomIdAndStatusIn(eq(25L), anyList()))
                .thenAnswer(inv -> List.copyOf(sharedBookings));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            sharedBookings.add(b);
            return b;
        });

        int numThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CyclicBarrier barrier = new CyclicBarrier(numThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        List<Callable<Void>> tasks = List.of(
                () -> {
                    barrier.await();
                    Booking b1 = new Booking(2L, roomId25, today.plusDays(1), today.plusDays(6), 25000.0, "CARD");
                    try {
                        bookingService.createBooking(b1);
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        failureCount.incrementAndGet();
                    }
                    return null;
                },
                () -> {
                    barrier.await();
                    Booking b2 = new Booking(3L, roomId25, today.plusDays(1), today.plusDays(6), 25000.0, "CARD");
                    try {
                        bookingService.createBooking(b2);
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        failureCount.incrementAndGet();
                    }
                    return null;
                }
        );

        List<Future<Void>> futures = executor.invokeAll(tasks);
        for (Future<Void> f : futures) {
            f.get();
        }
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one booking must succeed for room 25");
        assertEquals(1, failureCount.get(), "The concurrent overlapping booking for room 25 must be rejected");
        verify(roomLockRepository, atLeast(2)).insertIfNotExists(eq(25L));
        verify(roomLockRepository, atLeast(2)).findByRoomIdForUpdate(eq(25L));
    }
}
