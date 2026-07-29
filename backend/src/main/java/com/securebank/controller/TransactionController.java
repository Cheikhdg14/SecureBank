package com.securebank.controller;

import com.securebank.dto.ApiResponse;
import com.securebank.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/transfer/initiate")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<?>> initiate(@RequestBody TransferBody body, HttpServletRequest req) {
        return ResponseEntity.ok(transactionService.initiateTransfer(
                body.sourceAccount, body.destinationAccount, body.amount, body.description, getIp(req)));
    }

    @PostMapping("/transfer/confirm")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<?>> confirm(@RequestBody ConfirmBody body, HttpServletRequest req) {
        return ResponseEntity.ok(transactionService.confirmTransfer(body.reference, body.otpCode, getIp(req)));
    }

    @GetMapping("/history/{accountNumber}")
    @PreAuthorize("hasAnyRole('CLIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<?>> history(@PathVariable String accountNumber) {
        return ResponseEntity.ok(transactionService.getHistory(accountNumber));
    }

    private String getIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        return (ip != null) ? ip.split(",")[0] : req.getRemoteAddr();
    }

    static class TransferBody { public String sourceAccount, destinationAccount, description; public BigDecimal amount; }
    static class ConfirmBody  { public String reference, otpCode; }
}
