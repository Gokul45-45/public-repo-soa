package com.starlight.roomservice;

import com.starlight.roomservice.controller.GlobalExceptionHandler;
import com.starlight.roomservice.controller.RoomController;
import com.starlight.roomservice.entity.Room;
import com.starlight.roomservice.exception.ResourceNotFoundException;
import com.starlight.roomservice.service.RoomService;
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
class RoomControllerTest {

    @Mock
    private RoomService roomService;

    @InjectMocks
    private RoomController roomController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(roomController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/rooms should return list of rooms")
    void testGetAllRooms() throws Exception {
        Room room = new Room(1L, "101", "DELUXE", 2, 3500.0, "AVAILABLE");
        when(roomService.getAllRooms()).thenReturn(List.of(room));

        mockMvc.perform(get("/api/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomNumber").value("101"));
    }

    @Test
    @DisplayName("POST /api/rooms should create room successfully")
    void testCreateRoom() throws Exception {
        Room room = new Room(1L, "101", "DELUXE", 2, 3500.0, "AVAILABLE");
        when(roomService.addRoom(any(Room.class))).thenReturn(room);

        mockMvc.perform(post("/api/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"hotelId\":1,\"roomNumber\":\"101\",\"roomType\":\"DELUXE\",\"capacity\":2,\"price\":3500.0,\"status\":\"AVAILABLE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("101"));
    }

    @Test
    @DisplayName("GET /api/rooms/9999 for nonexistent room returns 404 Not Found (previously returned 500)")
    void testGetNonexistentRoomReturns404() throws Exception {
        when(roomService.getRoomById(9999L)).thenThrow(new ResourceNotFoundException("Room not found with ID: 9999"));

        mockMvc.perform(get("/api/rooms/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Room not found with ID: 9999"));
    }
}
