package com.securebank.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String reference;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_account_id")
    private Account sourceAccount;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_account_id")
    private Account destinationAccount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime processedAt;

    public Transaction() {}

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    // Getters
    public Long getId() { return id; }
    public String getReference() { return reference; }
    public BigDecimal getAmount() { return amount; }
    public String getDescription() { return description; }
    public TransactionStatus getStatus() { return status; }
    public TransactionType getType() { return type; }
    public Account getSourceAccount() { return sourceAccount; }
    public Account getDestinationAccount() { return destinationAccount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getProcessedAt() { return processedAt; }

    // Setters
    public void setStatus(TransactionStatus v) { this.status = v; }
    public void setProcessedAt(LocalDateTime v) { this.processedAt = v; }

    // Builder
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final Transaction t = new Transaction();
        public Builder reference(String v) { t.reference = v; return this; }
        public Builder amount(BigDecimal v) { t.amount = v; return this; }
        public Builder description(String v) { t.description = v; return this; }
        public Builder status(TransactionStatus v) { t.status = v; return this; }
        public Builder type(TransactionType v) { t.type = v; return this; }
        public Builder sourceAccount(Account v) { t.sourceAccount = v; return this; }
        public Builder destinationAccount(Account v) { t.destinationAccount = v; return this; }
        public Transaction build() { return t; }
    }

    public enum TransactionStatus { PENDING, COMPLETED, FAILED, CANCELLED }
    public enum TransactionType { TRANSFER, DEPOSIT, WITHDRAWAL }
}