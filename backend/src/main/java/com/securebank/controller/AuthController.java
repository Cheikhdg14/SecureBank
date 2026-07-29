package com.securebank.controller;

import com.securebank.dto.ApiResponse;
import com.securebank.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody RegisterBody body, HttpServletRequest req) {
        return ResponseEntity.ok(authService.register(body.email, body.password, body.fullName, body.phone, getIp(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@RequestBody LoginBody body, HttpServletRequest req) {
        return ResponseEntity.ok(authService.login(body.email, body.password, getIp(req)));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<?>> verifyOtp(@RequestBody OtpBody body, HttpServletRequest req) {
        return ResponseEntity.ok(authService.verifyOtp(body.email, body.code, body.purpose, getIp(req)));
    }

    private String getIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        return (ip != null) ? ip.split(",")[0] : req.getRemoteAddr();
    }

    static class RegisterBody { public String email, password, fullName, phone; }
    static class LoginBody    { public String email, password; }
    static class OtpBody      { public String email, code, purpose; }
}
