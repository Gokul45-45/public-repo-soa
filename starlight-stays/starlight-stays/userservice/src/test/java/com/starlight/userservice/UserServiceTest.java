package com.starlight.userservice;

import com.starlight.userservice.dto.LoginRequest;
import com.starlight.userservice.entity.User;
import com.starlight.userservice.exception.ResourceNotFoundException;
import com.starlight.userservice.repository.UserRepository;
import com.starlight.userservice.security.JwtUtil;
import com.starlight.userservice.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User("Alice Johnson", "alice@starlight.com", "SecretPassword123", "9876543210", "CUSTOMER");
    }

    @Test
    @DisplayName("Should successfully register a new customer")
    void testRegisterUser_Success() {
        when(userRepository.existsByEmail("alice@starlight.com")).thenReturn(false);
        when(passwordEncoder.encode("SecretPassword123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User registered = userService.register(sampleUser);

        assertNotNull(registered);
        assertEquals("alice@starlight.com", registered.getEmail());
        assertEquals("encodedPassword", registered.getPassword());
        assertEquals("CUSTOMER", registered.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should reject public registration attempting to specify ADMIN role")
    void testRegisterUser_AdminRoleRejected() {
        User adminAttempt = new User("Mallory", "mallory@starlight.com", "SecretPassword123", "9876543210", "ADMIN");
        when(userRepository.existsByEmail("mallory@starlight.com")).thenReturn(false);
        when(passwordEncoder.encode("SecretPassword123")).thenReturn("encodedPassword");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> userService.register(adminAttempt));
        assertTrue(ex.getMessage().contains("Registration with administrator privileges is not permitted"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should default role to CUSTOMER when role is null")
    void testRegisterUser_DefaultRoleCustomer() {
        User userWithoutRole = new User("Bob", "bob@starlight.com", "SecretPassword123", "9876543210", null);
        when(userRepository.existsByEmail("bob@starlight.com")).thenReturn(false);
        when(passwordEncoder.encode("SecretPassword123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User registered = userService.register(userWithoutRole);
        assertEquals("CUSTOMER", registered.getRole());
    }

    @Test
    @DisplayName("Should reject duplicate email registration")
    void testRegisterUser_DuplicateEmail() {
        when(userRepository.existsByEmail("alice@starlight.com")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> userService.register(sampleUser));
        assertTrue(ex.getMessage().contains("Email already registered"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should successfully login with correct credentials")
    void testLogin_Success() {
        LoginRequest request = new LoginRequest("alice@starlight.com", "SecretPassword123");
        sampleUser.setPassword("encodedPassword");

        when(userRepository.findByEmail("alice@starlight.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("SecretPassword123", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken(sampleUser.getId(), sampleUser.getEmail(), sampleUser.getRole()))
                .thenReturn("mock.jwt.token");

        String token = userService.login(request);

        assertNotNull(token);
        assertEquals("mock.jwt.token", token);
    }

    @Test
    @DisplayName("Should reject login with incorrect password")
    void testLogin_IncorrectPassword() {
        LoginRequest request = new LoginRequest("alice@starlight.com", "WrongPassword");
        sampleUser.setPassword("encodedPassword");

        when(userRepository.findByEmail("alice@starlight.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", "encodedPassword")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.login(request));
        assertTrue(ex.getMessage().contains("Invalid email or password"));
    }

    @Test
    @DisplayName("Should retrieve user by existing ID")
    void testGetUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        User user = userService.getUserById(1L);

        assertNotNull(user);
        assertEquals("alice@starlight.com", user.getEmail());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for nonexistent user ID")
    void testGetUserById_NotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById(999L));
    }

    @Test
    @DisplayName("Should list all users")
    void testGetAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(sampleUser));

        List<User> users = userService.getAllUsers();

        assertEquals(1, users.size());
    }
}
