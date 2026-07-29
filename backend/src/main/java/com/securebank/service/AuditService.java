package com.securebank.service;

import com.securebank.crypto.HmacUtil;
import com.securebank.model.AuditLog;
import com.securebank.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final HmacUtil hmacUtil;

    public AuditService(AuditLogRepository auditLogRepository, HmacUtil hmacUtil) {
        this.auditLogRepository = auditLogRepository;
        this.hmacUtil = hmacUtil;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String actorEmail, String targetResource,
                    String details, String ipAddress) {
        String previousHash = auditLogRepository.findTopByOrderByIdDesc()
                .map(AuditLog::getHmacHash)
                .orElse("GENESIS");

        AuditLog entry = AuditLog.builder()
                .action(action)
                .actorEmail(actorEmail)
                .targetResource(targetResource)
                .details(details)
                .ipAddress(ipAddress)
                .previousHash(previousHash)
                .hmacHash("PENDING")
                .build();

        String hash = hmacUtil.compute(
                action, actorEmail,
                targetResource != null ? targetResource : "",
                String.valueOf(System.currentTimeMillis()),
                previousHash);
        entry.setHmacHash(hash);
        auditLogRepository.save(entry);
    }

    public List<AuditLog> getLogsForUser(String email) {
        return auditLogRepository.findByActorEmailOrderByTimestampDesc(email);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    public boolean verifyChainIntegrity() {
        List<AuditLog> logs = auditLogRepository.findAll();
        for (int i = 1; i < logs.size(); i++) {
            if (!logs.get(i).getPreviousHash().equals(logs.get(i - 1).getHmacHash())) {
                return false;
            }
        }
        return true;
    }
}
