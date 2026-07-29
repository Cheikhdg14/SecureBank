package com.securebank.controller;

import com.securebank.dto.ApiResponse;
import com.securebank.model.Account;
import com.securebank.model.AccountDeletionRequest;
import com.securebank.model.Transaction;
import com.securebank.model.User;
import com.securebank.repository.AccountDeletionRequestRepository;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.TransactionRepository;
import com.securebank.repository.UserRepository;
import com.securebank.service.AuditService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AuditService auditService;
    private final AccountDeletionRequestRepository deletionRequestRepository;

    public AdminController(UserRepository userRepository,
                           AccountRepository accountRepository,
                           TransactionRepository transactionRepository,
                           AuditService auditService,
                           AccountDeletionRequestRepository deletionRequestRepository) {
        this.userRepository            = userRepository;
        this.accountRepository         = accountRepository;
        this.transactionRepository     = transactionRepository;
        this.auditService              = auditService;
        this.deletionRequestRepository = deletionRequestRepository;
    }

    // ── Utilisateurs ─────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<?>> allUsers() {
        return ResponseEntity.ok(
                ApiResponse.ok("Utilisateurs", userRepository.findAll()));
    }

    @PatchMapping("/users/{id}/enable")
    public ResponseEntity<ApiResponse<?>> enableUser(
            @PathVariable Long id, @RequestParam boolean enabled) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null)
            return ResponseEntity.ok(ApiResponse.error("Introuvable"));
        user.setEnabled(enabled);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Statut mis à jour", null));
    }

    @GetMapping("/users/suspended")
    public ResponseEntity<ApiResponse<?>> suspendedUsers() {
        List<User> suspended = userRepository.findAll().stream()
                .filter(u -> !u.isEnabled())
                .collect(Collectors.toList());
        return ResponseEntity.ok(
                ApiResponse.ok("Utilisateurs suspendus", suspended));
    }

    // ── Comptes ───────────────────────────────────
    @PatchMapping("/accounts/{number}/suspend")
    public ResponseEntity<ApiResponse<?>> suspendAccount(
            @PathVariable String number) {
        Account account = accountRepository
                .findByAccountNumber(number).orElse(null);
        if (account == null)
            return ResponseEntity.ok(ApiResponse.error("Introuvable"));
        account.setStatus(Account.AccountStatus.SUSPENDED);
        accountRepository.save(account);
        return ResponseEntity.ok(ApiResponse.ok("Compte suspendu", null));
    }

    @GetMapping("/accounts/suspended")
    public ResponseEntity<ApiResponse<?>> suspendedAccounts() {
        List<Account> suspended = accountRepository.findAll().stream()
                .filter(a -> a.getStatus() == Account.AccountStatus.SUSPENDED)
                .collect(Collectors.toList());
        return ResponseEntity.ok(
                ApiResponse.ok("Comptes suspendus", suspended));
    }

    // ── Dépôt admin ───────────────────────────────
    @PostMapping("/accounts/{number}/deposit")
    public ResponseEntity<ApiResponse<?>> adminDeposit(
            @PathVariable String number,
            @RequestBody DepositBody body) {
        Account account = accountRepository
                .findByAccountNumber(number).orElse(null);
        if (account == null)
            return ResponseEntity.ok(ApiResponse.error("Compte introuvable"));
        if (account.getStatus() != Account.AccountStatus.ACTIVE)
            return ResponseEntity.ok(ApiResponse.error("Compte inactif"));
        if (body.amount == null ||
                body.amount.compareTo(BigDecimal.ZERO) <= 0)
            return ResponseEntity.ok(ApiResponse.error("Montant invalide"));
        account.setBalance(account.getBalance().add(body.amount));
        accountRepository.save(account);
        return ResponseEntity.ok(
                ApiResponse.ok("Dépôt effectué", account.getBalance()));
    }

    // ── Suppression directe admin ─────────────────
    @DeleteMapping("/accounts/{number}")
    public ResponseEntity<ApiResponse<?>> deleteAccount(
            @PathVariable String number) {
        Account account = accountRepository
                .findByAccountNumber(number).orElse(null);
        if (account == null)
            return ResponseEntity.ok(ApiResponse.error("Compte introuvable"));
        if (account.getBalance().compareTo(BigDecimal.ZERO) > 0)
            return ResponseEntity.ok(ApiResponse.error(
                    "Suppression refusée : solde non nul (" +
                    account.getBalance() + " FCFA)"));
        accountRepository.delete(account);
        return ResponseEntity.ok(ApiResponse.ok("Compte supprimé", null));
    }

    // ── Demandes de suppression ───────────────────
    @GetMapping("/deletion-requests")
    public ResponseEntity<ApiResponse<?>> deletionRequests() {
        return ResponseEntity.ok(ApiResponse.ok("Demandes",
                deletionRequestRepository.findByStatusOrderByCreatedAtDesc(
                        AccountDeletionRequest.RequestStatus.PENDING)));
    }

    @PostMapping("/deletion-requests/{id}/approve")
    public ResponseEntity<ApiResponse<?>> approveDeletion(
            @PathVariable Long id) {
        AccountDeletionRequest req =
                deletionRequestRepository.findById(id).orElse(null);
        if (req == null)
            return ResponseEntity.ok(ApiResponse.error("Demande introuvable"));
        Account account = accountRepository
                .findByAccountNumber(req.getAccountNumber()).orElse(null);
        if (account == null)
            return ResponseEntity.ok(ApiResponse.error("Compte introuvable"));
        if (account.getBalance().compareTo(BigDecimal.ZERO) > 0)
            return ResponseEntity.ok(ApiResponse.error(
                    "Suppression refusée : le compte possède encore un solde de "
                    + account.getBalance() +
                    " FCFA. Le client doit d'abord vider son compte."));
        accountRepository.delete(account);
        req.setStatus(AccountDeletionRequest.RequestStatus.APPROVED);
        req.setProcessedAt(LocalDateTime.now());
        deletionRequestRepository.save(req);
        return ResponseEntity.ok(ApiResponse.ok("Compte supprimé", null));
    }

    @PostMapping("/deletion-requests/{id}/reject")
    public ResponseEntity<ApiResponse<?>> rejectDeletion(
            @PathVariable Long id,
            @RequestBody(required = false) CommentBody body) {
        AccountDeletionRequest req =
                deletionRequestRepository.findById(id).orElse(null);
        if (req == null)
            return ResponseEntity.ok(ApiResponse.error("Demande introuvable"));
        req.setStatus(AccountDeletionRequest.RequestStatus.REJECTED);
        req.setAdminComment(body != null ? body.comment : null);
        req.setProcessedAt(LocalDateTime.now());
        deletionRequestRepository.save(req);
        return ResponseEntity.ok(ApiResponse.ok("Demande refusée", null));
    }

    // ── Statistiques anonymisées ──────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<?>> stats() {
        List<Transaction> completed = transactionRepository.findAll().stream()
                .filter(t -> t.getStatus() ==
                        Transaction.TransactionStatus.COMPLETED)
                .collect(Collectors.toList());

        BigDecimal totalVire = completed.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeClients = userRepository.findAll().stream()
                .filter(u -> u.isEnabled() &&
                        u.getRole() == User.Role.ROLE_CLIENT)
                .count();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        BigDecimal volumeJour = completed.stream()
                .filter(t -> t.getCreatedAt().isAfter(todayStart))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long transactionsAujourdHui = completed.stream()
                .filter(t -> t.getCreatedAt().isAfter(todayStart))
                .count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalTransactions", completed.size());
        stats.put("totalVire", totalVire);
        stats.put("clientsActifs", activeClients);
        stats.put("volumeJour", volumeJour);
        stats.put("transactionsAujourdHui", transactionsAujourdHui);

        return ResponseEntity.ok(ApiResponse.ok("Statistiques", stats));
    }

    // ── Transactions filtrées ─────────────────────
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<?>> transactions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        List<Map<String, Object>> result = transactionRepository.findAll()
                .stream()
                .filter(t -> status == null ||
                        t.getStatus().name().equalsIgnoreCase(status))
                .filter(t -> minAmount == null ||
                        t.getAmount().compareTo(minAmount) >= 0)
                .filter(t -> maxAmount == null ||
                        t.getAmount().compareTo(maxAmount) <= 0)
                .filter(t -> from == null ||
                        !t.getCreatedAt().toLocalDate().isBefore(from))
                .filter(t -> to == null ||
                        !t.getCreatedAt().toLocalDate().isAfter(to))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("reference", t.getReference());
                    m.put("amount", t.getAmount());
                    m.put("status", t.getStatus());
                    m.put("type", t.getType());
                    m.put("createdAt", t.getCreatedAt());
                    m.put("processedAt", t.getProcessedAt());
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok("Transactions", result));
    }

    // ── Export CSV ────────────────────────────────
    @GetMapping("/transactions/export")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        List<Transaction> result = transactionRepository.findAll().stream()
                .filter(t -> status == null ||
                        t.getStatus().name().equalsIgnoreCase(status))
                .filter(t -> minAmount == null ||
                        t.getAmount().compareTo(minAmount) >= 0)
                .filter(t -> maxAmount == null ||
                        t.getAmount().compareTo(maxAmount) <= 0)
                .filter(t -> from == null ||
                        !t.getCreatedAt().toLocalDate().isBefore(from))
                .filter(t -> to == null ||
                        !t.getCreatedAt().toLocalDate().isAfter(to))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());

        StringBuilder csv = new StringBuilder();
        csv.append("Reference,Montant,Statut,Type,Date\n");
        for (Transaction t : result) {
            csv.append(t.getReference()).append(",")
               .append(t.getAmount()).append(",")
               .append(t.getStatus()).append(",")
               .append(t.getType()).append(",")
               .append(t.getCreatedAt()).append("\n");
        }

        byte[] bytes = csv.toString().getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"transactions.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    // ── Audit ─────────────────────────────────────
    @GetMapping("/audit")
    public ResponseEntity<ApiResponse<?>> auditLogs() {
        return ResponseEntity.ok(
                ApiResponse.ok("Journal", auditService.getAllLogs()));
    }

    @GetMapping("/audit/integrity")
    public ResponseEntity<ApiResponse<?>> checkIntegrity() {
        boolean ok = auditService.verifyChainIntegrity();
        return ResponseEntity.ok(ApiResponse.ok(
                ok ? "Intégrité vérifiée" : "Falsification détectée!", ok));
    }

    // ── Classes internes ──────────────────────────
    static class DepositBody  { public BigDecimal amount; }
    static class CommentBody  { public String comment; }
}