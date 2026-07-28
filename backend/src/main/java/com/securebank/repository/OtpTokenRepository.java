package com.securebank.repository;

import com.securebank.model.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByUserEmailAndCodeAndPurposeAndUsedFalse(
            String email, String code, String purpose);

    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.expiresAt < :now")
    void deleteExpiredTokens(LocalDateTime now);
}
