package com.starlight.roomservice.controller;

import com.starlight.roomservice.entity.Room;
import com.starlight.roomservice.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<Room> addRoom(
            @RequestBody Room room) {

        return ResponseEntity.ok(
                roomService.addRoom(room)
        );
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {

        return ResponseEntity.ok(
                roomService.getAllRooms()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                roomService.getRoomById(id)
        );
    }

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<Room>> getRoomsByHotel(
            @PathVariable Long hotelId) {

        return ResponseEntity.ok(
                roomService.getRoomsByHotel(hotelId)
        );
    }

    @GetMapping("/hotel/{hotelId}/available")
    public ResponseEntity<List<Room>> getAvailableRooms(
            @PathVariable Long hotelId) {

        return ResponseEntity.ok(
                roomService.getAvailableRooms(hotelId)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRoom(
            @PathVariable Long id) {

        roomService.deleteRoom(id);

        return ResponseEntity.ok(
                "Room deleted successfully"
        );
    }
}