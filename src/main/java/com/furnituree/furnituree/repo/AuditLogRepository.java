package com.furnituree.furnituree.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.furnituree.furnituree.model.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
