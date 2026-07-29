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
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final int MAX_ATTEMPTS  = 3;
    private static final int LOCK_MINUTES  = 15;
    private static final int MAX_KNOWN_IPS = 3;
    private static final Pattern PWD_DIGIT   = Pattern.compile(".*\\d.*");
    private static final Pattern PWD_SPECIAL = Pattern.compile(
        ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final OtpService otpService;
    private final AuditService auditService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil,
                       UserDetailsService userDetailsService,
                       OtpService otpService,
                       AuditService auditService,
                       EmailService emailService) {
        this.userRepository        = userRepository;
        this.passwordEncoder       = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil               = jwtUtil;
        this.userDetailsService    = userDetailsService;
        this.otpService            = otpService;
        this.auditService          = auditService;
        this.emailService          = emailService;
    }

    // ── Validation mot de passe ──────────────────
    public String validatePassword(String password) {
        if (password == null || password.length() < 8)
            return "Le mot de passe doit contenir au moins 8 caractères";
        if (!PWD_DIGIT.matcher(password).matches())
            return "Le mot de passe doit contenir au moins un chiffre";
        if (!PWD_SPECIAL.matcher(password).matches())
            return "Le mot de passe doit contenir au moins un caractère spécial";
        return null;
    }

    // ── Inscription ──────────────────────────────
    @Transactional
    public ApiResponse<?> register(String email, String password,
                                   String fullName, String phone, String ip) {
        if (userRepository.existsByEmail(email))
            return ApiResponse.error("Email déjà utilisé");
        String pwdError = validatePassword(password);
        if (pwdError != null) return ApiResponse.error(pwdError);

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName).phone(phone)
                .role(User.Role.ROLE_CLIENT)
                .enabled(false).twoFactorEnabled(true)
                .build();
        userRepository.save(user);
        auditService.log("USER_REGISTERED", email, null, "Nouvelle inscription", ip);
        return ApiResponse.ok("Compte créé, en attente d'activation", null);
    }

    // ── Connexion ────────────────────────────────
    @Transactional
    public ApiResponse<?> login(String email, String password, String ip) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ApiResponse.error("Identifiants invalides");

        // Compte verrouillé ?
        if (user.isLocked()) {
            long minutes = java.time.Duration.between(
                LocalDateTime.now(), user.getLockedUntil()).toMinutes();
            return ApiResponse.error("Compte verrouillé. Réessayez dans " + (minutes + 1) + " minute(s)");
        }

        // Vérification du mot de passe
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= MAX_ATTEMPTS) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
                auditService.log("ACCOUNT_LOCKED", email, null,
                    "Verrouillage après " + MAX_ATTEMPTS + " tentatives", ip);
                emailService.send(email, "SecureBank – Compte temporairement verrouillé",
                    "Bonjour " + user.getFullName() + ",\n\n" +
                    "Votre compte a été verrouillé pendant " + LOCK_MINUTES +
                    " minutes suite à " + MAX_ATTEMPTS + " tentatives échouées.\n\n" +
                    "L'équipe SecureBank");
                return ApiResponse.error("Compte verrouillé 15 minutes après " +
                    MAX_ATTEMPTS + " tentatives échouées");
            }
            userRepository.save(user);
            auditService.log("LOGIN_FAILED", email, null,
                "Tentative " + attempts + "/" + MAX_ATTEMPTS, ip);
            return ApiResponse.error("Identifiants invalides (" + attempts +
                "/" + MAX_ATTEMPTS + " tentatives)");
        }

        if (!user.isEnabled())
            return ApiResponse.error("Compte non activé par l'administrateur");

        // Réinitialiser le compteur d'échecs
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);

        // Détection IP suspecte
        checkIp(user, ip);
        userRepository.save(user);

        // Mot de passe expiré ?
        if (user.isPasswordExpired()) {
            auditService.log("PASSWORD_EXPIRED", email, null, "Changement obligatoire", ip);
            return ApiResponse.ok("Mot de passe expiré", Map.of("passwordExpired", true, "email", email));
        }

        // OTP
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

    // ── Vérification OTP ─────────────────────────
    @Transactional
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

    // ── Mot de passe oublié ──────────────────────
    @Transactional
    public ApiResponse<?> forgotPassword(String email, String ip) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null)
            return ApiResponse.ok("Si cet email existe, un lien a été envoyé", null);
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);
        emailService.sendPasswordResetEmail(email, user.getFullName(), token);
        auditService.log("PASSWORD_RESET_REQUESTED", email, null, "Token envoyé", ip);
        return ApiResponse.ok("Si cet email existe, un code a été envoyé", null);
    }

    // ── Réinitialiser le mot de passe ────────────
    @Transactional
    public ApiResponse<?> resetPassword(String email, String token,
                                         String newPassword, String ip) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.getResetPasswordToken() == null)
            return ApiResponse.error("Token invalide");
        if (!user.getResetPasswordToken().equals(token))
            return ApiResponse.error("Token invalide");
        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now()))
            return ApiResponse.error("Token expiré");
        String pwdError = validatePassword(newPassword);
        if (pwdError != null) return ApiResponse.error(pwdError);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);
        auditService.log("PASSWORD_RESET_DONE", email, null, "Mot de passe réinitialisé", ip);
        return ApiResponse.ok("Mot de passe réinitialisé avec succès", null);
    }

    // ── Changer le mot de passe (connecté) ───────
    @Transactional
    public ApiResponse<?> changePassword(String email, String oldPassword,
                                          String newPassword, String ip) {
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!passwordEncoder.matches(oldPassword, user.getPassword()))
            return ApiResponse.error("Ancien mot de passe incorrect");
        String pwdError = validatePassword(newPassword);
        if (pwdError != null) return ApiResponse.error(pwdError);
        if (passwordEncoder.matches(newPassword, user.getPassword()))
            return ApiResponse.error("Le nouveau mot de passe doit être différent de l'ancien");
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);
        auditService.log("PASSWORD_CHANGED", email, null, "Changement de mot de passe", ip);
        emailService.send(email, "SecureBank – Mot de passe modifié",
            "Bonjour " + user.getFullName() + ",\n\n" +
            "Votre mot de passe SecureBank a été modifié avec succès.\n" +
            "Si vous n'êtes pas à l'origine de cette action, contactez immédiatement l'administrateur.\n\n" +
            "L'équipe SecureBank");
        return ApiResponse.ok("Mot de passe modifié avec succès", null);
    }

    // ── Détection IP suspecte ────────────────────
    private void checkIp(User user, String ip) {
        if (ip == null || ip.isBlank()) return;
        String known = user.getKnownIps();
        List<String> ips = known != null && !known.isBlank()
            ? new ArrayList<>(Arrays.asList(known.split(",")))
            : new ArrayList<>();
        if (!ips.contains(ip)) {
            emailService.sendIpAlert(user.getEmail(), user.getFullName(), ip);
            auditService.log("SUSPICIOUS_IP", user.getEmail(), null, "Nouvelle IP : " + ip, ip);
            ips.add(ip);
            if (ips.size() > MAX_KNOWN_IPS) ips.remove(0);
            user.setKnownIps(String.join(",", ips));
        }
    }
}