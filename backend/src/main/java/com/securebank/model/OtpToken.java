package com.securebank.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_tokens")
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String purpose;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public OtpToken() {}

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }

    // Getters
    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getUserEmail() { return userEmail; }
    public String getPurpose() { return purpose; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public boolean isUsed() { return used; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setUsed(boolean v) { this.used = v; }

    // Builder
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final OtpToken o = new OtpToken();
        public Builder code(String v) { o.code = v; return this; }
        public Builder userEmail(String v) { o.userEmail = v; return this; }
        public Builder purpose(String v) { o.purpose = v; return this; }
        public Builder expiresAt(LocalDateTime v) { o.expiresAt = v; return this; }
        public Builder used(boolean v) { o.used = v; return this; }
        public OtpToken build() { return o; }
    }
}
