package com.securebank.service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;   // ✅ correctif : SecureRandom

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.securebank.dto.ApiResponse;
import com.securebank.model.Account;
import com.securebank.model.AccountDeletionRequest;
import com.securebank.model.User;
import com.securebank.repository.AccountDeletionRequestRepository;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.UserRepository;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final AccountDeletionRequestRepository deletionRequestRepository;
    private final EmailService emailService;

    // ✅ Instance unique de SecureRandom
    private static final SecureRandom RANDOM = new SecureRandom();

    public AccountService(AccountRepository accountRepository,
                          UserRepository userRepository,
                          AuditService auditService,
                          AccountDeletionRequestRepository deletionRequestRepository,
                          EmailService emailService) {
        this.accountRepository         = accountRepository;
        this.userRepository            = userRepository;
        this.auditService              = auditService;
        this.deletionRequestRepository = deletionRequestRepository;
        this.emailService              = emailService;
    }

    // ── Créer un compte ───────────────────────────
    @Transactional
    public ApiResponse<?> createAccount(String type, BigDecimal initialDeposit,
                                         String ip) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User owner = userRepository.findByEmail(email).orElseThrow();
        Account account = Account.builder()
                .accountNumber(generateAccountNumber())
                .balance(initialDeposit)
                .status(Account.AccountStatus.ACTIVE)
                .type(Account.AccountType.valueOf(type))
                .owner(owner)
                .build();
        accountRepository.save(account);
        auditService.log("ACCOUNT_CREATED", email, account.getAccountNumber(),
                "Type: " + type + ", Dépôt: " + initialDeposit, ip);
        return ApiResponse.ok("Compte créé avec succès", account.getAccountNumber());
    }

    // ── Mes comptes ───────────────────────────────
    public ApiResponse<?> getMyAccounts() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User owner = userRepository.findByEmail(email).orElseThrow();
        List<Account> accounts = accountRepository.findByOwner(owner);
        return ApiResponse.ok("Comptes récupérés", accounts);
    }

    // ── Solde ─────────────────────────────────────
    public ApiResponse<?> getBalance(String accountNumber) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Account account = accountRepository
                .findByAccountNumber(accountNumber).orElse(null);
        if (account == null) return ApiResponse.error("Compte introuvable");
        if (!account.getOwner().getEmail().equals(email))
            return ApiResponse.error("Accès refusé");
        return ApiResponse.ok("Solde récupéré", account.getBalance());
    }

    // ── Dépôt client ──────────────────────────────
    @Transactional
    public ApiResponse<?> deposit(String accountNumber, BigDecimal amount,
                                   String ip) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            return ApiResponse.error("Le montant doit être supérieur à zéro");
        Account account = accountRepository
                .findByAccountNumber(accountNumber).orElse(null);
        if (account == null) return ApiResponse.error("Compte introuvable");
        if (!account.getOwner().getEmail().equals(email))
            return ApiResponse.error("Accès refusé");
        if (account.getStatus() != Account.AccountStatus.ACTIVE)
            return ApiResponse.error("Compte inactif");
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);
        auditService.log("DEPOSIT", email, accountNumber,
                "Dépôt de " + amount + " FCFA", ip);
        return ApiResponse.ok("Dépôt effectué avec succès", account.getBalance());
    }

    // ── Demande de suppression (client) ───────────
    @Transactional
    public ApiResponse<?> requestDeletion(String accountNumber, String ip) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Account account = accountRepository
                .findByAccountNumber(accountNumber).orElse(null);
        if (account == null) return ApiResponse.error("Compte introuvable");
        if (!account.getOwner().getEmail().equals(email))
            return ApiResponse.error("Accès refusé");

        // Vérifier qu'une demande n'est pas déjà en attente
        boolean alreadyPending = deletionRequestRepository
                .findByAccountNumberAndStatus(accountNumber,
                        AccountDeletionRequest.RequestStatus.PENDING)
                .isPresent();
        if (alreadyPending)
            return ApiResponse.error(
                    "Une demande de suppression est déjà en attente pour ce compte");

        AccountDeletionRequest req = AccountDeletionRequest.builder()
                .accountNumber(accountNumber)
                .requesterEmail(email)
                .status(AccountDeletionRequest.RequestStatus.PENDING)
                .build();
        deletionRequestRepository.save(req);
        auditService.log("DELETION_REQUESTED", email, accountNumber,
                "Demande de suppression", ip);

        // Notifier les admins
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ROLE_ADMIN && u.isEnabled())
                .forEach(admin -> emailService.send(
                        admin.getEmail(),
                        "SecureBank – Demande de suppression de compte",
                        "Bonjour " + admin.getFullName() + ",\n\n" +
                        "Le client " + email + " demande la suppression du compte "
                        + accountNumber + ".\n" +
                        "Solde actuel : " + account.getBalance() + " FCFA.\n\n" +
                        "Connectez-vous au tableau de bord admin pour traiter cette demande.\n\n" +
                        "L'équipe SecureBank"));

        return ApiResponse.ok(
                "Demande de suppression envoyée à l'administrateur", null);
    }

    // ── Mes demandes de suppression ───────────────
    public ApiResponse<?> getMyDeletionRequests() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return ApiResponse.ok("Demandes",
                deletionRequestRepository
                        .findByRequesterEmailOrderByCreatedAtDesc(email));
    }

    // ── Utilitaires ───────────────────────────────
    public Account findByAccountNumber(String number) {
        return accountRepository.findByAccountNumber(number)
                .orElseThrow(() ->
                        new RuntimeException("Compte introuvable : " + number));
    }

    @Transactional
    public void updateBalance(Account account, BigDecimal newBalance) {
        account.setBalance(newBalance);
        accountRepository.save(account);
    }

    // ✅ Correctif : génération sécurisée du numéro de compte
    private String generateAccountNumber() {
        String number;
        do {
            number = "SB" + String.format("%010d",
                    Math.abs(RANDOM.nextLong()) % 9_999_999_999L);
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }
}
