package com.starlight.hotelservice.service;

import com.starlight.hotelservice.entity.Hotel;
import com.starlight.hotelservice.exception.ResourceNotFoundException;
import com.starlight.hotelservice.repository.HotelRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HotelService {

    private final HotelRepository hotelRepository;

    public HotelService(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    public Hotel addHotel(Hotel hotel) {
        if (hotel.getName() == null || hotel.getName().isBlank()) {
            throw new IllegalArgumentException("Hotel name is required");
        }
        if (hotel.getLocation() == null || hotel.getLocation().isBlank()) {
            throw new IllegalArgumentException("Hotel location is required");
        }
        return hotelRepository.save(hotel);
    }

    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll();
    }

    public Hotel getHotelById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Hotel ID cannot be null");
        }
        return hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + id));
    }

    public List<Hotel> getHotelsByLocation(String location) {
        if (location == null || location.isBlank()) {
            throw new IllegalArgumentException("Location cannot be blank");
        }
        return hotelRepository.findByLocationIgnoreCase(location);
    }

    public void deleteHotel(Long id) {
        Hotel hotel = getHotelById(id);
        hotelRepository.delete(hotel);
    }
}
