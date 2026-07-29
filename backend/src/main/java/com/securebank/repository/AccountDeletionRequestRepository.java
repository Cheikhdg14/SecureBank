package com.securebank.repository;

import com.securebank.model.AccountDeletionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountDeletionRequestRepository
        extends JpaRepository<AccountDeletionRequest, Long> {

    List<AccountDeletionRequest> findByRequesterEmailOrderByCreatedAtDesc(
            String email);

    List<AccountDeletionRequest> findByStatusOrderByCreatedAtDesc(
            AccountDeletionRequest.RequestStatus status);

    Optional<AccountDeletionRequest> findByAccountNumberAndStatus(
            String accountNumber,
            AccountDeletionRequest.RequestStatus status);
}