package com.starlight.hotelservice.controller;

import com.starlight.hotelservice.entity.Hotel;
import com.starlight.hotelservice.service.HotelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService hotelService;

    public HotelController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    @PostMapping
    public ResponseEntity<Hotel> addHotel(@RequestBody Hotel hotel) {
        return ResponseEntity.ok(hotelService.addHotel(hotel));
    }

    @GetMapping
    public ResponseEntity<List<Hotel>> getAllHotels() {
        return ResponseEntity.ok(hotelService.getAllHotels());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Hotel> getHotelById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                hotelService.getHotelById(id)
        );
    }

    @GetMapping("/location/{location}")
    public ResponseEntity<List<Hotel>> getHotelsByLocation(
            @PathVariable String location) {

        return ResponseEntity.ok(
                hotelService.getHotelsByLocation(location)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHotel(
            @PathVariable Long id) {

        hotelService.deleteHotel(id);

        return ResponseEntity.ok("Hotel deleted successfully");
    }
}