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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public Role getRole() { return role; }
    public boolean isEnabled() { return enabled; }
    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public String getTotpSecret() { return totpSecret; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<Account> getAccounts() { return accounts; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setRole(Role role) { this.role = role; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public void setTwoFactorEnabled(boolean v) { this.twoFactorEnabled = v; }
    public void setTotpSecret(String totpSecret) { this.totpSecret = totpSecret; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setAccounts(List<Account> accounts) { this.accounts = accounts; }

    // Builder
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