package com.securebank;

import com.securebank.dto.ApiResponse;
import com.securebank.model.User;
import com.securebank.repository.UserRepository;
import com.securebank.security.JwtUtil;
import com.securebank.security.OtpService;
import com.securebank.service.AuditService;
import com.securebank.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtUtil jwtUtil;
    @Mock UserDetailsService userDetailsService;
    @Mock OtpService otpService;
    @Mock AuditService auditService;

    @InjectMocks AuthService authService;

    @BeforeEach void setUp() { MockitoAnnotations.openMocks(this); }

    @Test
    void register_shouldFail_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail("test@test.com")).thenReturn(true);
        ApiResponse<?> res = authService.register("test@test.com", "pass", "Name", "123", "127.0.0.1");
        assertFalse(res.isSuccess());
        assertEquals("Email déjà utilisé", res.getMessage());
    }

    @Test
    void register_shouldSucceed_withNewEmail() {
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("$2a$hash");
        ApiResponse<?> res = authService.register("new@test.com", "password123", "Full Name", "0700000000", "127.0.0.1");
        assertTrue(res.isSuccess());
        verify(userRepository, times(1)).save(any(User.class));
    }
}
