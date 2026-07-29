package com.securebank.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "account_deletion_requests")
public class AccountDeletionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String accountNumber;

    @Column(nullable = false)
    private String requesterEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @Column
    private String adminComment;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime processedAt;

    public AccountDeletionRequest() {}

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    // Getters
    public Long getId() { return id; }
    public String getAccountNumber() { return accountNumber; }
    public String getRequesterEmail() { return requesterEmail; }
    public RequestStatus getStatus() { return status; }
    public String getAdminComment() { return adminComment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }

    // Setters
    public void setStatus(RequestStatus v) { this.status = v; }
    public void setAdminComment(String v) { this.adminComment = v; }
    public void setProcessedAt(LocalDateTime v) { this.processedAt = v; }

    // Builder
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final AccountDeletionRequest r = new AccountDeletionRequest();
        public Builder accountNumber(String v) { r.accountNumber = v; return this; }
        public Builder requesterEmail(String v) { r.requesterEmail = v; return this; }
        public Builder status(RequestStatus v) { r.status = v; return this; }
        public AccountDeletionRequest build() { return r; }
    }

    public enum RequestStatus { PENDING, APPROVED, REJECTED }
}