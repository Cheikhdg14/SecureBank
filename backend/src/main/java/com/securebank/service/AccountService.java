package com.securebank.service;

import com.securebank.dto.ApiResponse;
import com.securebank.model.Account;
import com.securebank.model.User;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.Random;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository,
                          AuditService auditService) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public ApiResponse<?> createAccount(String type, BigDecimal initialDeposit, String ip) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
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
                "Type: " + type + ", Dépôt initial: " + initialDeposit, ip);
        return ApiResponse.ok("Compte créé avec succès", account.getAccountNumber());
    }

    public ApiResponse<?> getMyAccounts() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User owner = userRepository.findByEmail(email).orElseThrow();
        List<Account> accounts = accountRepository.findByOwner(owner);
        return ApiResponse.ok("Comptes récupérés", accounts);
    }

    public ApiResponse<?> getBalance(String accountNumber) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Account account = accountRepository.findByAccountNumber(accountNumber).orElse(null);
        if (account == null) return ApiResponse.error("Compte introuvable");
        if (!account.getOwner().getEmail().equals(email)) return ApiResponse.error("Accès refusé");
        return ApiResponse.ok("Solde récupéré", account.getBalance());
    }

    public Account findByAccountNumber(String number) {
        return accountRepository.findByAccountNumber(number)
                .orElseThrow(() -> new RuntimeException("Compte introuvable : " + number));
    }

    @Transactional
    public void updateBalance(Account account, BigDecimal newBalance) {
        account.setBalance(newBalance);
        accountRepository.save(account);
    }

    private String generateAccountNumber() {
        String number;
        do {
            number = "SB" + String.format("%010d", new Random().nextLong(9_999_999_999L));
        } while (accountRepository.existsByAccountNumber(number));
        return number;
    }
}
