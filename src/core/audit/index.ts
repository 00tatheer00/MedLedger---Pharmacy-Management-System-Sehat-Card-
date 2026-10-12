/**
 * MedLedger — Core Audit Logging
 *
 * This module provides:
 * - logAuditEvent(): Records a sensitive operation to the audit_events table.
 *
 * Audit events are written within the SAME database transaction as the
 * operation they record. If the operation fails, the audit record is
 * also rolled back.
 *
 * Audit records are append-only. No UPDATE or DELETE operations are
 * permitted on the audit table through the application.
 *
 * Implementation will be added in Phase 4 (Database, Auth & RLS).
 */

export {};
