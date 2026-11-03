package com.starlight.roomservice.repository;

import com.starlight.roomservice.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByHotelId(Long hotelId);

    List<Room> findByRoomTypeIgnoreCase(String roomType);

    List<Room> findByHotelIdAndStatus(
            Long hotelId,
            String status
    );
}