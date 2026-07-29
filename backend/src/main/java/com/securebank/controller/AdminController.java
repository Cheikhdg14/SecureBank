package com.securebank.controller;

import com.securebank.dto.ApiResponse;
import com.securebank.model.Account;
import com.securebank.model.User;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.UserRepository;
import com.securebank.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AuditService auditService;

    public AdminController(UserRepository userRepository, AccountRepository accountRepository,
                           AuditService auditService) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.auditService = auditService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<?>> allUsers() {
        return ResponseEntity.ok(ApiResponse.ok("Utilisateurs", userRepository.findAll()));
    }

    @PatchMapping("/users/{id}/enable")
    public ResponseEntity<ApiResponse<?>> enableUser(@PathVariable Long id, @RequestParam boolean enabled) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.ok(ApiResponse.error("Utilisateur introuvable"));
        user.setEnabled(enabled);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Statut mis à jour", null));
    }

    @PatchMapping("/accounts/{number}/suspend")
    public ResponseEntity<ApiResponse<?>> suspendAccount(@PathVariable String number) {
        Account account = accountRepository.findByAccountNumber(number).orElse(null);
        if (account == null) return ResponseEntity.ok(ApiResponse.error("Compte introuvable"));
        account.setStatus(Account.AccountStatus.SUSPENDED);
        accountRepository.save(account);
        return ResponseEntity.ok(ApiResponse.ok("Compte suspendu", null));
    }

    @GetMapping("/audit")
    public ResponseEntity<ApiResponse<?>> auditLogs() {
        return ResponseEntity.ok(ApiResponse.ok("Journal d'audit", auditService.getAllLogs()));
    }

    @GetMapping("/audit/integrity")
    public ResponseEntity<ApiResponse<?>> checkIntegrity() {
        boolean ok = auditService.verifyChainIntegrity();
        return ResponseEntity.ok(ApiResponse.ok(ok ? "Intégrité vérifiée" : "Falsification détectée!", ok));
    }
}
