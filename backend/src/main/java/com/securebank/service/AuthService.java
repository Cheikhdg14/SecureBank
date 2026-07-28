package com.securebank.service;

import com.securebank.dto.ApiResponse;
import com.securebank.model.User;
import com.securebank.repository.UserRepository;
import com.securebank.security.JwtUtil;
import com.securebank.security.OtpService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final OtpService otpService;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                       UserDetailsService userDetailsService, OtpService otpService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.otpService = otpService;
        this.auditService = auditService;
    }

    @Transactional
    public ApiResponse<?> register(String email, String password,
                                   String fullName, String phone, String ip) {
        if (userRepository.existsByEmail(email)) {
            return ApiResponse.error("Email déjà utilisé");
        }
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .phone(phone)
                .role(User.Role.ROLE_CLIENT)
                .enabled(false)
                .twoFactorEnabled(true)
                .build();
        userRepository.save(user);
        auditService.log("USER_REGISTERED", email, null, "Nouvelle inscription", ip);
        return ApiResponse.ok("Compte créé, en attente d'activation", null);
    }

    public ApiResponse<?> login(String email, String password, String ip) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            auditService.log("LOGIN_FAILED", email, null, "Mot de passe incorrect", ip);
            return ApiResponse.error("Identifiants invalides");
        }
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!user.isEnabled()) {
            return ApiResponse.error("Compte non activé par l'administrateur");
        }
        if (user.isTwoFactorEnabled()) {
            otpService.generateAndSend(email, "LOGIN");
            auditService.log("LOGIN_OTP_SENT", email, null, "OTP envoyé", ip);
            return ApiResponse.ok("OTP envoyé par email", Map.of("otpRequired", true));
        }
        UserDetails ud = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(ud);
        auditService.log("LOGIN_SUCCESS", email, null, "Connexion réussie", ip);
        return ApiResponse.ok("Connexion réussie", Map.of("token", token));
    }

    public ApiResponse<?> verifyOtp(String email, String code, String purpose, String ip) {
        if (!otpService.verify(email, code, purpose)) {
            auditService.log("OTP_FAILED", email, null, "OTP invalide pour " + purpose, ip);
            return ApiResponse.error("OTP invalide ou expiré");
        }
        UserDetails ud = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(ud);
        auditService.log("OTP_SUCCESS", email, null, purpose + " validé", ip);
        return ApiResponse.ok("OTP validé", Map.of("token", token));
    }
}
