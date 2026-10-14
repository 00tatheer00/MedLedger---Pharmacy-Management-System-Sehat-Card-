# MedLedger — Backup & Disaster Recovery Plan

**Facility:** DHQ Hospital Kohat  
**System:** Pharmacy & Hospital Claims Management System  
**Database Engine:** PostgreSQL 15+ (Supabase Managed Cluster)  
**Status:** Architecture Documented | Live Production Restore Exercise: **NOT TESTED** (pending infrastructure handover)

---

## 1. Objectives & Critical Metrics

MedLedger manages critical clinical dispensing records, medicine stock ledgers, patient prescriptions, hospital admissions, and insurance/billing claims for DHQ Hospital Kohat. A comprehensive backup and disaster recovery policy is mandatory to ensure patient safety, regulatory compliance, and business continuity.

### Target Recovery Metrics:

- **Recovery Point Objective (RPO):** **< 2 minutes**  
  _The maximum acceptable age of data that must be recovered from cache/WAL in the event of an outage._
- **Recovery Time Objective (RTO):** **< 30 minutes**  
  _The maximum allowable downtime from declaration of disaster to fully operational pharmacy dispensing._

---

## 2. Backup Architecture & Retention Policies

```
+-------------------------------------------------------------+
|                     PostgreSQL Database                     |
|            (DHQ Kohat Pharmacy & Claims Records)            |
+-------------------------------------------------------------+
            |                                  |
            v Continuous WAL Streaming         v Scheduled Snapshot
+-----------------------+           +-----------------------+
|  Write-Ahead Logging  |           | Daily Automated Dump  |
|     (WAL Archive)     |           |  (Logical + Schema)   |
+-----------------------+           +-----------------------+
            |                                  |
            +-----------------+----------------+
                              |
                              v Encrypted Storage (AES-256)
+-------------------------------------------------------------+
|           Supabase Managed Multi-AZ Backup Vault            |
|                  (Retention: 7 to 30 Days)                  |
+-------------------------------------------------------------+
```

### 2.1. Point-In-Time Recovery (PITR)

- **Mechanism:** Continuous archiving of Write-Ahead Logs (WAL) combined with base physical database backups.
- **Granularity:** Allows restoring the database to any specific second within the retention window (e.g., `2026-10-14 01:15:30 PKT`).
- **Retention Window:**
  - Staging Environment: 7 days.
  - Production Environment: 30 days.

### 2.2. Daily Logical Dumps

- Automated nightly pg_dump executed at 03:00 PKT.
- Encrypted and stored in geographically redundant cold storage.
- Retained for 90 days for audit and historical reconciliation requirements.

---

## 3. Database Restore Procedures

### 3.1. Point-In-Time Recovery (Fast Incident Recovery)

Used when accidental corruption, human error, or bad migration occurs at a known timestamp $T$.

1. **Freeze Application Writes:**
   Set application to maintenance mode or suspend client connections to prevent further discrepancies:
   ```bash
   vercel env add NEXT_PUBLIC_MAINTENANCE_MODE "true" production
   ```
2. **Initiate Restore in Supabase Dashboard:**
   - Navigate to **Project Settings > Database > Backups > Point in Time Recovery**.
   - Select the target timestamp $T_{restore}$ (e.g., 2 minutes prior to the incident).
   - Choose **Restore to New Project** (`medledger-prod-restored`).
3. **Verify Integrity of Restored Database:**
   - Execute the verification SQL script (Section 4).
   - Check foreign key consistency across `prescriptions`, `dispensing_records`, `stock_ledger`, and `claims`.
4. **Traffic Cutover:**
   - Update `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in production host to point to `medledger-prod-restored`.
   - Remove maintenance mode flag.
   - Verify health check (`/api/health`).

### 3.2. Manual CLI Restore (from Logical Dump)

Used for isolated testing or disaster migration across cloud providers:

```bash
# 1. Decrypt and download logical dump
# 2. Recreate database schema and extensions
psql -h <TARGET_HOST> -U postgres -d postgres -c "CREATE DATABASE medledger_recovery;"

# 3. Restore data and indexes
psql -h <TARGET_HOST> -U postgres -d medledger_recovery -f backup_20261013_0300.sql

# 4. Verify RLS policies and triggers
psql -h <TARGET_HOST> -U postgres -d medledger_recovery -c "SELECT count(*) FROM pg_policies;"
```

---

## 4. Post-Restore Data Verification Script

After any restore operation, run the following diagnostic script to guarantee database integrity before routing clinical staff traffic:

```sql
-- 1. Check Medicine Catalogue Count
SELECT count(*) AS medicine_count FROM medicines;

-- 2. Verify Stock Ledger Referential Integrity
SELECT count(*) AS orphaned_stock_movements
FROM stock_movements sm
LEFT JOIN inventory_batches ib ON sm.batch_id = ib.id
WHERE ib.id IS NULL;

-- 3. Verify Dispensing Traceability
SELECT count(*) AS orphaned_dispensing_lines
FROM dispensing_items di
LEFT JOIN dispensing_records dr ON di.dispensing_id = dr.id
WHERE dr.id IS NULL;

-- 4. Verify Claims Integrity
SELECT count(*) AS orphaned_claim_lines
FROM claim_line_items cli
LEFT JOIN claims c ON cli.claim_id = c.id
WHERE c.id IS NULL;

-- 5. Confirm RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected output: 0 rows (all public tables must have rowsecurity = true)
```

---

## 5. Migration Failure Recovery Procedure

If a database migration fails during deployment:

1. **Analyze Failure:** Review the exact PostgreSQL error in the CLI migration log.
2. **Assess State:** Determine whether the migration executed inside a transactional block (`BEGIN ... COMMIT`) and rolled back automatically, or left partial state.
3. **Forward-Fix vs Revert:**
   - If the failure is non-destructive (e.g., missing index or syntax typo in RPC function), draft a forward-fix migration:
     ```bash
     supabase migration new fix_rpc_syntax
     ```
   - If the migration corrupted existing table structures, immediately halt deployment and restore from the pre-release snapshot taken in Step 5.2 of the Deployment Runbook.
4. **Never drop tables or columns on live hospital records without prior backup verification.**

---

## 6. Disaster Recovery Exercise Status

| Drill Component                 | Target Scenario                      | Verification Status | Rationale / Notes                                               |
| :------------------------------ | :----------------------------------- | :------------------ | :-------------------------------------------------------------- |
| **Local Schema Re-creation**    | Apply all 7 migrations from blank DB | **VERIFIED**        | All migrations execute cleanly in order                         |
| **Health Probe Detection**      | Simulate DB disconnection            | **VERIFIED**        | `/api/health` transitions from 200 to 503                       |
| **Point-In-Time Cloud Restore** | Cloud cluster failover drill         | **NOT TESTED**      | Production Supabase account not yet provisioned by DHQ Kohat IT |
| **Offsite Backup Mirroring**    | Multi-region backup sync             | **NOT TESTED**      | Awaiting selection of offsite storage bucket                    |

> **Patient Privacy Rule:** Real hospital patient records must never be exported, decrypted, or restored onto unauthorized developer machines or unencrypted third-party platforms.
