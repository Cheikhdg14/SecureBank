package com.securebank.controller;

import com.securebank.dto.ApiResponse;
import com.securebank.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody RegisterBody body,
                                                    HttpServletRequest req) {
        return ResponseEntity.ok(authService.register(
            body.email, body.password, body.fullName, body.phone, getIp(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@RequestBody LoginBody body,
                                                 HttpServletRequest req) {
        return ResponseEntity.ok(authService.login(body.email, body.password, getIp(req)));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<?>> verifyOtp(@RequestBody OtpBody body,
                                                      HttpServletRequest req) {
        return ResponseEntity.ok(authService.verifyOtp(
            body.email, body.code, body.purpose, getIp(req)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<?>> forgotPassword(@RequestBody EmailBody body,
                                                           HttpServletRequest req) {
        return ResponseEntity.ok(authService.forgotPassword(body.email, getIp(req)));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<?>> resetPassword(@RequestBody ResetBody body,
                                                          HttpServletRequest req) {
        return ResponseEntity.ok(authService.resetPassword(
            body.email, body.token, body.newPassword, getIp(req)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<?>> changePassword(@RequestBody ChangeBody body,
                                                           HttpServletRequest req) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(authService.changePassword(
            email, body.oldPassword, body.newPassword, getIp(req)));
    }

    private String getIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        return (ip != null) ? ip.split(",")[0] : req.getRemoteAddr();
    }

    static class RegisterBody { public String email, password, fullName, phone; }
    static class LoginBody    { public String email, password; }
    static class OtpBody      { public String email, code, purpose; }
    static class EmailBody    { public String email; }
    static class ResetBody    { public String email, token, newPassword; }
    static class ChangeBody   { public String oldPassword, newPassword; }
}