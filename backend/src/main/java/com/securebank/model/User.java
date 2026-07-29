package com.securebank.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(nullable = false)
    private boolean twoFactorEnabled = false;

    @JsonIgnore
    @Column
    private String totpSecret;

    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    @Column
    private LocalDateTime lockedUntil;

    @Column
    private LocalDateTime passwordChangedAt;

    @Column(length = 500)
    private String knownIps;

    @JsonIgnore
    @Column
    private String resetPasswordToken;

    @Column
    private LocalDateTime resetPasswordTokenExpiry;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Account> accounts;

    public User() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        passwordChangedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Helpers métier ────────────────────────────
    public boolean isLocked() {
        return lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);
    }

    public boolean isPasswordExpired() {
        if (passwordChangedAt == null) return false;
        int days = role == Role.ROLE_ADMIN ? 30 : 90;
        return passwordChangedAt.plusDays(days).isBefore(LocalDateTime.now());
    }

    // ── Getters ───────────────────────────────────
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public Role getRole() { return role; }
    public boolean isEnabled() { return enabled; }
    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public String getTotpSecret() { return totpSecret; }
    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public LocalDateTime getLockedUntil() { return lockedUntil; }
    public LocalDateTime getPasswordChangedAt() { return passwordChangedAt; }
    public String getKnownIps() { return knownIps; }
    public String getResetPasswordToken() { return resetPasswordToken; }
    public LocalDateTime getResetPasswordTokenExpiry() { return resetPasswordTokenExpiry; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<Account> getAccounts() { return accounts; }

    // ── Setters ───────────────────────────────────
    public void setId(Long id) { this.id = id; }
    public void setEmail(String v) { this.email = v; }
    public void setPassword(String v) { this.password = v; }
    public void setFullName(String v) { this.fullName = v; }
    public void setPhone(String v) { this.phone = v; }
    public void setRole(Role v) { this.role = v; }
    public void setEnabled(boolean v) { this.enabled = v; }
    public void setTwoFactorEnabled(boolean v) { this.twoFactorEnabled = v; }
    public void setTotpSecret(String v) { this.totpSecret = v; }
    public void setFailedLoginAttempts(int v) { this.failedLoginAttempts = v; }
    public void setLockedUntil(LocalDateTime v) { this.lockedUntil = v; }
    public void setPasswordChangedAt(LocalDateTime v) { this.passwordChangedAt = v; }
    public void setKnownIps(String v) { this.knownIps = v; }
    public void setResetPasswordToken(String v) { this.resetPasswordToken = v; }
    public void setResetPasswordTokenExpiry(LocalDateTime v) { this.resetPasswordTokenExpiry = v; }
    public void setUpdatedAt(LocalDateTime v) { this.updatedAt = v; }
    public void setAccounts(List<Account> v) { this.accounts = v; }

    // ── Builder ───────────────────────────────────
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final User u = new User();
        public Builder email(String v) { u.email = v; return this; }
        public Builder password(String v) { u.password = v; return this; }
        public Builder fullName(String v) { u.fullName = v; return this; }
        public Builder phone(String v) { u.phone = v; return this; }
        public Builder role(Role v) { u.role = v; return this; }
        public Builder enabled(boolean v) { u.enabled = v; return this; }
        public Builder twoFactorEnabled(boolean v) { u.twoFactorEnabled = v; return this; }
        public User build() { return u; }
    }

    public enum Role { ROLE_CLIENT, ROLE_ADMIN }
}