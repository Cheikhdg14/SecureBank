package com.securebank.repository;

import com.securebank.model.Account;
import com.securebank.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByReference(String reference);

    @Query("SELECT t FROM Transaction t WHERE t.sourceAccount = :account OR t.destinationAccount = :account ORDER BY t.createdAt DESC")
    Page<Transaction> findByAccount(Account account, Pageable pageable);

    List<Transaction> findBySourceAccountOrderByCreatedAtDesc(Account account);
    List<Transaction> findByDestinationAccountOrderByCreatedAtDesc(Account account);
}
