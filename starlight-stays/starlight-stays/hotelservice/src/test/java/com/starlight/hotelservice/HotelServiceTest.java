package com.starlight.hotelservice;

import com.starlight.hotelservice.entity.Hotel;
import com.starlight.hotelservice.exception.ResourceNotFoundException;
import com.starlight.hotelservice.repository.HotelRepository;
import com.starlight.hotelservice.service.HotelService;
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
class HotelServiceTest {

    @Mock
    private HotelRepository hotelRepository;

    @InjectMocks
    private HotelService hotelService;

    private Hotel sampleHotel;

    @BeforeEach
    void setUp() {
        sampleHotel = new Hotel("Starlight Grand Resort", "Goa", "Calangute Beach Road", "5-star luxury seaside resort", "9876543210");
    }

    @Test
    @DisplayName("Should successfully create a valid hotel")
    void testAddHotel_Success() {
        when(hotelRepository.save(any(Hotel.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Hotel created = hotelService.addHotel(sampleHotel);

        assertNotNull(created);
        assertEquals("Starlight Grand Resort", created.getName());
        assertEquals("Goa", created.getLocation());
        verify(hotelRepository, times(1)).save(any(Hotel.class));
    }

    @Test
    @DisplayName("Should reject hotel with blank name")
    void testAddHotel_BlankName() {
        sampleHotel.setName("  ");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> hotelService.addHotel(sampleHotel));
        assertTrue(ex.getMessage().contains("Hotel name is required"));
    }

    @Test
    @DisplayName("Should reject hotel with blank location")
    void testAddHotel_BlankLocation() {
        sampleHotel.setLocation("");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> hotelService.addHotel(sampleHotel));
        assertTrue(ex.getMessage().contains("Hotel location is required"));
    }

    @Test
    @DisplayName("Should retrieve hotel by ID")
    void testGetHotelById_Success() {
        when(hotelRepository.findById(1L)).thenReturn(Optional.of(sampleHotel));

        Hotel hotel = hotelService.getHotelById(1L);

        assertNotNull(hotel);
        assertEquals("Starlight Grand Resort", hotel.getName());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for nonexistent hotel ID")
    void testGetHotelById_NotFound() {
        when(hotelRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> hotelService.getHotelById(999L));
    }

    @Test
    @DisplayName("Should list all hotels")
    void testGetAllHotels() {
        when(hotelRepository.findAll()).thenReturn(List.of(sampleHotel));

        List<Hotel> hotels = hotelService.getAllHotels();

        assertEquals(1, hotels.size());
    }
}
