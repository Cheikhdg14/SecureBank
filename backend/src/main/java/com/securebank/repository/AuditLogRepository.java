package com.securebank.repository;

import com.securebank.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorEmailOrderByTimestampDesc(String email);
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    Optional<AuditLog> findTopByOrderByIdDesc();   // Pour récupérer le dernier hash

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :start AND :end ORDER BY a.timestamp DESC")
    List<AuditLog> findBetweenDates(LocalDateTime start, LocalDateTime end);
}
