package com.securebank.security;

import com.securebank.model.OtpToken;
import com.securebank.repository.OtpTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final JavaMailSender mailSender;

    @Value("${app.otp.length:6}")
    private int otpLength;

    @Value("${app.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public OtpService(OtpTokenRepository otpTokenRepository, JavaMailSender mailSender) {
        this.otpTokenRepository = otpTokenRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public void generateAndSend(String email, String purpose) {
        String code = generateCode();
        OtpToken token = OtpToken.builder()
                .code(code)
                .userEmail(email)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .used(false)
                .build();
        otpTokenRepository.save(token);
        sendByEmail(email, code, purpose);
    }

    @Transactional
    public boolean verify(String email, String code, String purpose) {
        return otpTokenRepository
                .findByUserEmailAndCodeAndPurposeAndUsedFalse(email, code, purpose)
                .map(token -> {
                    if (token.isExpired()) return false;
                    token.setUsed(true);
                    otpTokenRepository.save(token);
                    return true;
                })
                .orElse(false);
    }

    private String generateCode() {
        SecureRandom rng = new SecureRandom();
        int max = (int) Math.pow(10, otpLength);
        return String.format("%0" + otpLength + "d", rng.nextInt(max));
    }

    private void sendByEmail(String to, String code, String purpose) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(to);
        msg.setSubject("SecureBank – Code OTP " + purpose);
        msg.setText("Votre code OTP : " + code + "\nValide " + expiryMinutes + " minutes.\nNe le partagez pas.");
        mailSender.send(msg);
    }
}
