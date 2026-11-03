package com.starlight.roomservice.service;

import com.starlight.roomservice.entity.Room;
import com.starlight.roomservice.exception.ResourceNotFoundException;
import com.starlight.roomservice.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class RoomService {

    private static final Set<String> VALID_STATUSES = Set.of("AVAILABLE", "MAINTENANCE", "INACTIVE");

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room addRoom(Room room) {
        if (room.getHotelId() == null || room.getHotelId() <= 0) {
            throw new IllegalArgumentException("Valid hotel ID is required");
        }
        if (room.getRoomNumber() == null || room.getRoomNumber().isBlank()) {
            throw new IllegalArgumentException("Room number is required");
        }
        if (room.getRoomType() == null || room.getRoomType().isBlank()) {
            throw new IllegalArgumentException("Room type is required");
        }
        if (room.getCapacity() == null || room.getCapacity() <= 0) {
            throw new IllegalArgumentException("Capacity must be greater than zero");
        }
        if (room.getPrice() == null || room.getPrice() < 0) {
            throw new IllegalArgumentException("Price cannot be negative or null");
        }

        if (room.getStatus() == null || room.getStatus().isBlank()) {
            room.setStatus("AVAILABLE");
        } else {
            String upperStatus = room.getStatus().toUpperCase();
            if (!VALID_STATUSES.contains(upperStatus)) {
                throw new IllegalArgumentException("Invalid room status: " + room.getStatus() + ". Allowed: " + VALID_STATUSES);
            }
            room.setStatus(upperStatus);
        }

        return roomRepository.save(room);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room getRoomById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Room ID cannot be null");
        }
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));
    }

    public List<Room> getRoomsByHotel(Long hotelId) {
        if (hotelId == null) {
            throw new IllegalArgumentException("Hotel ID cannot be null");
        }
        return roomRepository.findByHotelId(hotelId);
    }

    public List<Room> getAvailableRooms(Long hotelId) {
        if (hotelId == null) {
            throw new IllegalArgumentException("Hotel ID cannot be null");
        }
        return roomRepository.findByHotelIdAndStatus(hotelId, "AVAILABLE");
    }

    public void deleteRoom(Long id) {
        Room room = getRoomById(id);
        roomRepository.delete(room);
    }
}
