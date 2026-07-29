package com.securebank.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false)
    private String actorEmail;

    @Column
    private String targetResource;

    @Column(length = 500)
    private String details;

    @Column(length = 45)
    private String ipAddress;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false, length = 64)
    private String hmacHash;

    @Column(length = 64)
    private String previousHash;

    public AuditLog() {}

    @PrePersist
    protected void onCreate() { timestamp = LocalDateTime.now(); }

    // Getters
    public Long getId() { return id; }
    public String getAction() { return action; }
    public String getActorEmail() { return actorEmail; }
    public String getTargetResource() { return targetResource; }
    public String getDetails() { return details; }
    public String getIpAddress() { return ipAddress; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getHmacHash() { return hmacHash; }
    public String getPreviousHash() { return previousHash; }

    // Setters
    public void setHmacHash(String v) { this.hmacHash = v; }

    // Builder
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final AuditLog a = new AuditLog();
        public Builder action(String v) { a.action = v; return this; }
        public Builder actorEmail(String v) { a.actorEmail = v; return this; }
        public Builder targetResource(String v) { a.targetResource = v; return this; }
        public Builder details(String v) { a.details = v; return this; }
        public Builder ipAddress(String v) { a.ipAddress = v; return this; }
        public Builder hmacHash(String v) { a.hmacHash = v; return this; }
        public Builder previousHash(String v) { a.previousHash = v; return this; }
        public AuditLog build() { return a; }
    }
}
