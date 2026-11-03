package com.starlight.hotelservice;

import com.starlight.hotelservice.controller.GlobalExceptionHandler;
import com.starlight.hotelservice.controller.HotelController;
import com.starlight.hotelservice.entity.Hotel;
import com.starlight.hotelservice.exception.ResourceNotFoundException;
import com.starlight.hotelservice.service.HotelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class HotelControllerTest {

    @Mock
    private HotelService hotelService;

    @InjectMocks
    private HotelController hotelController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(hotelController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/hotels should return list of hotels")
    void testGetAllHotels() throws Exception {
        Hotel hotel = new Hotel("Starlight Grand Resort", "Goa", "Beach Rd", "Luxury", "9876543210");
        when(hotelService.getAllHotels()).thenReturn(List.of(hotel));

        mockMvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Starlight Grand Resort"));
    }

    @Test
    @DisplayName("POST /api/hotels should create hotel successfully")
    void testCreateHotel() throws Exception {
        Hotel hotel = new Hotel("Starlight Grand Resort", "Goa", "Beach Rd", "Luxury", "9876543210");
        when(hotelService.addHotel(any(Hotel.class))).thenReturn(hotel);

        mockMvc.perform(post("/api/hotels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Starlight Grand Resort\",\"location\":\"Goa\",\"address\":\"Beach Rd\",\"description\":\"Luxury\",\"contactNumber\":\"9876543210\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Starlight Grand Resort"));
    }

    @Test
    @DisplayName("GET /api/hotels/{id} with nonexistent ID should return 404 Not Found")
    void testGetHotelNotFound() throws Exception {
        when(hotelService.getHotelById(999L)).thenThrow(new ResourceNotFoundException("Hotel not found with ID: 999"));

        mockMvc.perform(get("/api/hotels/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Hotel not found with ID: 999"));
    }
}
