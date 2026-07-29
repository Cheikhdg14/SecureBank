package com.securebank.controller;

import com.securebank.dto.ApiResponse;
import com.securebank.service.AccountService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<?>> create(@RequestBody CreateBody body,
                                                   HttpServletRequest req) {
        return ResponseEntity.ok(accountService.createAccount(
                body.type, body.initialDeposit, getIp(req)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<?>> myAccounts() {
        return ResponseEntity.ok(accountService.getMyAccounts());
    }

    @GetMapping("/{accountNumber}/balance")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<?>> balance(
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getBalance(accountNumber));
    }

    @PostMapping("/{accountNumber}/deposit")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<?>> deposit(
            @PathVariable String accountNumber,
            @RequestBody DepositBody body,
            HttpServletRequest req) {
        return ResponseEntity.ok(accountService.deposit(
                accountNumber, body.amount, getIp(req)));
    }

    @PostMapping("/{accountNumber}/request-deletion")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<?>> requestDeletion(
            @PathVariable String accountNumber,
            HttpServletRequest req) {
        return ResponseEntity.ok(accountService.requestDeletion(
                accountNumber, getIp(req)));
    }

    @GetMapping("/deletion-requests")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<?>> myDeletionRequests() {
        return ResponseEntity.ok(accountService.getMyDeletionRequests());
    }

    private String getIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        return (ip != null) ? ip.split(",")[0] : req.getRemoteAddr();
    }

    static class CreateBody {
        public String type;
        public BigDecimal initialDeposit;
    }

    static class DepositBody {
        public BigDecimal amount;
    }
}