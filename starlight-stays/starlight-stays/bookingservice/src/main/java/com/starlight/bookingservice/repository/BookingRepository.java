package com.starlight.bookingservice.repository;

import com.starlight.bookingservice.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByRoomIdAndStatus(Long roomId, String status);

    List<Booking> findByRoomIdAndStatusIn(Long roomId, List<String> statuses);

    List<Booking> findByUserId(Long userId);

    List<Booking> findByRoomId(Long roomId);
}
