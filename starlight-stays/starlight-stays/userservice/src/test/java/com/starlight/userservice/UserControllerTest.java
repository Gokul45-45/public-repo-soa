package com.starlight.userservice;

import com.starlight.userservice.controller.GlobalExceptionHandler;
import com.starlight.userservice.controller.UserController;
import com.starlight.userservice.dto.LoginRequest;
import com.starlight.userservice.entity.User;
import com.starlight.userservice.exception.ResourceNotFoundException;
import com.starlight.userservice.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
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
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/users/register should return 200 OK")
    void testRegisterEndpoint() throws Exception {
        User user = new User("Alice", "alice@starlight.com", "Secret123", "9876543210", "CUSTOMER");
        when(userService.register(any(User.class))).thenReturn(user);

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Alice\",\"email\":\"alice@starlight.com\",\"password\":\"Secret123\",\"phone\":\"9876543210\",\"role\":\"CUSTOMER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@starlight.com"));
    }

    @Test
    @DisplayName("POST /api/users/register duplicate email should return 400 Bad Request")
    void testRegisterDuplicateEmail() throws Exception {
        when(userService.register(any(User.class))).thenThrow(new IllegalArgumentException("Email already registered"));

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Alice\",\"email\":\"alice@starlight.com\",\"password\":\"Secret123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    @DisplayName("POST /api/users/login invalid credentials should return 401 Unauthorized")
    void testLoginInvalidCredentials() throws Exception {
        when(userService.login(any(LoginRequest.class))).thenThrow(new RuntimeException("Invalid email or password"));

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alice@starlight.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("GET /api/users/{id} not found should return 404 Not Found")
    void testGetUserNotFound() throws Exception {
        when(userService.getUserById(999L)).thenThrow(new ResourceNotFoundException("User not found with ID: 999"));

        mockMvc.perform(get("/api/users/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found with ID: 999"));
    }

    @Test
    @DisplayName("GET /api/users/{id} customer attempting to view another user's details should return 403 Forbidden")
    void testCustomerCannotAccessAnotherCustomerDetails() throws Exception {
        User bob = new User("Bob", "bob@starlight.com", "pass", "9999999999", "CUSTOMER");
        when(userService.getUserById(3L)).thenReturn(bob);

        // Authenticated as Alice (CUSTOMER)
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "alice@starlight.com", null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        mockMvc.perform(get("/api/users/3"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not authorized to view another user's details"));
    }

    @Test
    @DisplayName("GET /api/users customer attempting to list all users should return 403 Forbidden")
    void testCustomerCannotListAllUsers() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "alice@starlight.com", null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You are not authorized to view the user list"));
    }

    @Test
    @DisplayName("POST /api/users/register attempting ADMIN role should return 400 Bad Request")
    void testRegisterAdminRoleRejected() throws Exception {
        when(userService.register(any(User.class)))
                .thenThrow(new IllegalArgumentException("Registration with administrator privileges is not permitted"));

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Mallory\",\"email\":\"mallory@starlight.com\",\"password\":\"Secret123\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Registration with administrator privileges is not permitted"));
    }
}
