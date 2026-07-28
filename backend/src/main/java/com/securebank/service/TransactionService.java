package com.securebank.service;

import com.securebank.dto.ApiResponse;
import com.securebank.model.Account;
import com.securebank.model.Transaction;
import com.securebank.repository.TransactionRepository;
import com.securebank.security.OtpService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountService accountService;
    private final OtpService otpService;
    private final AuditService auditService;

    public TransactionService(TransactionRepository transactionRepository,
                               AccountService accountService, OtpService otpService,
                               AuditService auditService) {
        this.transactionRepository = transactionRepository;
        this.accountService = accountService;
        this.otpService = otpService;
        this.auditService = auditService;
    }

    @Transactional
    public ApiResponse<?> initiateTransfer(String sourceNumber, String destNumber,
                                           BigDecimal amount, String description, String ip) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Account source = accountService.findByAccountNumber(sourceNumber);
        if (!source.getOwner().getEmail().equals(email)) return ApiResponse.error("Accès refusé");
        if (source.getBalance().compareTo(amount) < 0) return ApiResponse.error("Provision insuffisante");
        if (source.getStatus() != Account.AccountStatus.ACTIVE) return ApiResponse.error("Compte source inactif");
        Account dest = accountService.findByAccountNumber(destNumber);
        if (dest.getStatus() != Account.AccountStatus.ACTIVE) return ApiResponse.error("Compte destinataire inactif");

        Transaction tx = Transaction.builder()
                .reference(UUID.randomUUID().toString())
                .amount(amount)
                .description(description)
                .status(Transaction.TransactionStatus.PENDING)
                .type(Transaction.TransactionType.TRANSFER)
                .sourceAccount(source)
                .destinationAccount(dest)
                .build();
        transactionRepository.save(tx);
        otpService.generateAndSend(email, "TRANSFER");
        auditService.log("TRANSFER_INITIATED", email, tx.getReference(),
                sourceNumber + " → " + destNumber + " : " + amount, ip);
        return ApiResponse.ok("OTP de confirmation envoyé", tx.getReference());
    }

    @Transactional
    public ApiResponse<?> confirmTransfer(String reference, String otpCode, String ip) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Transaction tx = transactionRepository.findByReference(reference).orElse(null);
        if (tx == null || tx.getStatus() != Transaction.TransactionStatus.PENDING)
            return ApiResponse.error("Transaction introuvable ou déjà traitée");
        if (!otpService.verify(email, otpCode, "TRANSFER")) {
            auditService.log("TRANSFER_OTP_FAILED", email, reference, "OTP invalide", ip);
            return ApiResponse.error("OTP invalide ou expiré");
        }
        Account source = tx.getSourceAccount();
        Account dest = tx.getDestinationAccount();
        source.setBalance(source.getBalance().subtract(tx.getAmount()));
        dest.setBalance(dest.getBalance().add(tx.getAmount()));
        accountService.updateBalance(source, source.getBalance());
        accountService.updateBalance(dest, dest.getBalance());
        tx.setStatus(Transaction.TransactionStatus.COMPLETED);
        tx.setProcessedAt(LocalDateTime.now());
        transactionRepository.save(tx);
        auditService.log("TRANSFER_COMPLETED", email, reference, "Montant: " + tx.getAmount(), ip);
        return ApiResponse.ok("Virement effectué avec succès", reference);
    }

    public ApiResponse<?> getHistory(String accountNumber) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Account account = accountService.findByAccountNumber(accountNumber);
        if (!account.getOwner().getEmail().equals(email)) return ApiResponse.error("Accès refusé");
        List<Transaction> history = transactionRepository.findBySourceAccountOrderByCreatedAtDesc(account);
        history.addAll(transactionRepository.findByDestinationAccountOrderByCreatedAtDesc(account));
        history.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return ApiResponse.ok("Historique récupéré", history);
    }
}
