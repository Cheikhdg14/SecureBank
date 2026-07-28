package com.securebank.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "accounts")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String accountNumber;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "sourceAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> sentTransactions;

    @JsonIgnore
    @OneToMany(mappedBy = "destinationAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> receivedTransactions;

    public Account() {}

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    // Getters
    public Long getId() { return id; }
    public String getAccountNumber() { return accountNumber; }
    public BigDecimal getBalance() { return balance; }
    public AccountStatus getStatus() { return status; }
    public AccountType getType() { return type; }
    public User getOwner() { return owner; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setAccountNumber(String v) { this.accountNumber = v; }
    public void setBalance(BigDecimal v) { this.balance = v; }
    public void setStatus(AccountStatus v) { this.status = v; }
    public void setType(AccountType v) { this.type = v; }
    public void setOwner(User v) { this.owner = v; }

    // Builder
    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private final Account a = new Account();
        public Builder accountNumber(String v) { a.accountNumber = v; return this; }
        public Builder balance(BigDecimal v) { a.balance = v; return this; }
        public Builder status(AccountStatus v) { a.status = v; return this; }
        public Builder type(AccountType v) { a.type = v; return this; }
        public Builder owner(User v) { a.owner = v; return this; }
        public Account build() { return a; }
    }

    public enum AccountStatus { PENDING, ACTIVE, SUSPENDED, CLOSED }
    public enum AccountType { CHECKING, SAVINGS }
}