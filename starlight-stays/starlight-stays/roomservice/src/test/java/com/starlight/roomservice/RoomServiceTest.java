package com.starlight.roomservice;

import com.starlight.roomservice.entity.Room;
import com.starlight.roomservice.exception.ResourceNotFoundException;
import com.starlight.roomservice.repository.RoomRepository;
import com.starlight.roomservice.service.RoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @InjectMocks
    private RoomService roomService;

    private Room sampleRoom;

    @BeforeEach
    void setUp() {
        sampleRoom = new Room(1L, "101", "DELUXE", 2, 3500.0, "AVAILABLE");
    }

    @Test
    @DisplayName("Should successfully create a valid room")
    void testAddRoom_Success() {
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Room created = roomService.addRoom(sampleRoom);

        assertNotNull(created);
        assertEquals("101", created.getRoomNumber());
        assertEquals("AVAILABLE", created.getStatus());
        verify(roomRepository, times(1)).save(any(Room.class));
    }

    @Test
    @DisplayName("Should reject room with missing hotel ID")
    void testAddRoom_MissingHotelId() {
        sampleRoom.setHotelId(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> roomService.addRoom(sampleRoom));
        assertTrue(ex.getMessage().contains("Valid hotel ID is required"));
    }

    @Test
    @DisplayName("Should reject room with non-positive capacity")
    void testAddRoom_InvalidCapacity() {
        sampleRoom.setCapacity(0);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> roomService.addRoom(sampleRoom));
        assertTrue(ex.getMessage().contains("Capacity must be greater than zero"));
    }

    @Test
    @DisplayName("Should reject room with negative price")
    void testAddRoom_NegativePrice() {
        sampleRoom.setPrice(-100.0);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> roomService.addRoom(sampleRoom));
        assertTrue(ex.getMessage().contains("Price cannot be negative or null"));
    }

    @Test
    @DisplayName("Should reject room with invalid status")
    void testAddRoom_InvalidStatus() {
        sampleRoom.setStatus("INVALID_STATUS");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> roomService.addRoom(sampleRoom));
        assertTrue(ex.getMessage().contains("Invalid room status"));
    }

    @Test
    @DisplayName("Should retrieve room by ID")
    void testGetRoomById_Success() {
        when(roomRepository.findById(1L)).thenReturn(Optional.of(sampleRoom));

        Room room = roomService.getRoomById(1L);

        assertNotNull(room);
        assertEquals("101", room.getRoomNumber());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for nonexistent room ID (Fixing previous 500 error)")
    void testGetRoomById_NotFound() {
        when(roomRepository.findById(9999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> roomService.getRoomById(9999L));
        assertTrue(ex.getMessage().contains("Room not found with ID: 9999"));
    }

    @Test
    @DisplayName("Should retrieve available rooms for a hotel")
    void testGetAvailableRooms() {
        when(roomRepository.findByHotelIdAndStatus(1L, "AVAILABLE")).thenReturn(List.of(sampleRoom));

        List<Room> rooms = roomService.getAvailableRooms(1L);

        assertEquals(1, rooms.size());
        assertEquals("AVAILABLE", rooms.get(0).getStatus());
    }
}
