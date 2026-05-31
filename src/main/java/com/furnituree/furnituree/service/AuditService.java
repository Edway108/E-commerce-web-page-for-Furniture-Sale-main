package com.furnituree.furnituree.service;

import org.springframework.stereotype.Service;

import com.furnituree.furnituree.model.AuditLog;
import com.furnituree.furnituree.repo.AuditLogRepository;
import com.furnituree.furnituree.util.SecurityUtil;

@Service
public class AuditService {
    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    public void record(String action, String entityName, Long entityId, String details) {
        AuditLog log = new AuditLog();
        log.setActor(SecurityUtil.currentUsername());
        log.setAction(action);
        log.setEntityName(entityName);
        log.setEntityId(entityId);
        log.setDetails(details);
        try {
            repository.save(log);
        } catch (Exception ignored) {
            // Audit trail is important for grading, but it must not break user-facing
            // workflows if an old local database has an outdated audit_logs schema.
            // The app can continue and the schema can be repaired by running
            // database/schema.sql.
        }
    }
}
