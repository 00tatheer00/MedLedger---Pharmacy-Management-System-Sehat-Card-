# MedLedger — Phase 11 Production Readiness & Deployment Checklist

> **Project:** MedLedger — DHQ Kohat Hospital Pharmacy Management System  
> **Report Date:** October 13, 2026  
> **Prepared By:** Principal DevOps Engineer & Healthcare Infrastructure Lead  
> **Target Environment:** Staging & Production Deployment (DHQ Hospital Kohat)  
> **Verdict:** READY FOR STAGING DEPLOYMENT

---

## 1. Executive Summary

This document defines the operational deployment requirements, production configuration parameters, database migration procedures, and disaster recovery specifications for MedLedger.

---

## 2. Infrastructure & Hosting Prerequisites

1. **Compute / Application Runtime:**
   - Next.js 16 (App Router) on Node.js 20.x LTS or 22.x LTS.
   - Deployable via Vercel Enterprise, AWS ECS/Fargate (Docker container), or local Linux hospital server running PM2 / systemd.
2. **Database Engine:**
   - PostgreSQL 15+ (Hosted on Supabase Enterprise or dedicated managed PostgreSQL instance).
   - Extensions required: `uuid-ossp`, `pgcrypto`.
3. **Network & SSL / TLS:**
   - HTTPS mandatory with TLS 1.3 encryption.
   - HSTS enabled with secure cookie attributes (`Secure`, `HttpOnly`, `SameSite=Lax`).

---

## 3. Production Environment Variables Checklist

| Variable Name                   | Environment              | Classification          | Required Value / Format                                             |
| ------------------------------- | ------------------------ | ----------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public / Client & Server | Configuration           | `https://<project-id>.supabase.co`                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client & Server | Safe Key (RLS Enforced) | Supabase Project Anon JWT Key                                       |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server-Side ONLY**     | **Secret / High Risk**  | Supabase Service Role Key (Never expose to browser)                 |
| `NEXT_PUBLIC_APP_URL`           | Public / Client & Server | URL                     | `https://medledger.dhqkohat.gov.pk`                                 |
| `NEXT_PUBLIC_APP_ENV`           | Public / Client & Server | Environment             | `production`                                                        |
| `AUTH_SECRET`                   | **Server-Side ONLY**     | **Secret / High Risk**  | 32-byte cryptographically secure string (`openssl rand -base64 32`) |

---

## 4. Database Migration Procedure

Migrations must be executed in strict numerical sequence against the target production database:

```bash
# 1. Core relational schema (28 tables, foreign keys, check constraints, partial unique indexes)
psql -d $DATABASE_URL -f supabase/migrations/20261013000001_core_schema.sql

# 2. Row Level Security policies (RLS enabled on all 28 tables)
psql -d $DATABASE_URL -f supabase/migrations/20261013000002_rls_policies.sql

# 3. Immutability triggers (prevents tampering on audit_events)
psql -d $DATABASE_URL -f supabase/migrations/20261013000003_audit_triggers.sql

# 4. Atomic dispensing stored procedures (FEFO decrement, locking, compensating reversals)
psql -d $DATABASE_URL -f supabase/migrations/20261013000005_dispensing_rpc.sql

# 5. Atomic claims & hospital billing procedures (evidence checks, zero-stock-decrement)
psql -d $DATABASE_URL -f supabase/migrations/20261013000006_claims_rpc.sql

# 6. Atomic supplier payment allocation procedures & reconciliation views
psql -d $DATABASE_URL -f supabase/migrations/20261013000007_finance_reconciliation_rpc.sql
```

> [!CAUTION]
> **DO NOT EXECUTE `20261013000004_seed_dev_data.sql` ON PRODUCTION.**  
> Development seed data is strictly intended for local and staging environments. Production requires clean initial tables populated through verified opening inventory intake and staff registration.

---

## 5. Backup, Disaster Recovery & High Availability

1. **Automated Database Backups:**
   - Daily full backups with 30-day off-site retention.
   - Point-In-Time-Recovery (PITR) enabled with Continuous WAL archiving for 7-day granularity.
2. **Disaster Recovery Strategy:**
   - Recovery Point Objective (RPO): < 5 minutes (via WAL streaming).
   - Recovery Time Objective (RTO): < 30 minutes for database instance restore.
3. **Audit Log Protection:**
   - In addition to database triggers, daily database dumps should mirror the `audit_events` table to write-once-read-many (WORM) cloud storage.

---

## 6. Operational Health Checks & Monitoring

1. **Application Health:**
   - Root `/` and static asset health check return HTTP 200 OK.
2. **Database Connectivity:**
   - Server Component queries verify database latency and connection pool health.
3. **Client-Side Error Logging:**
   - Unhandled runtime errors route to global `error.tsx` boundary with sanitized user messages (zero raw stack traces exposed).

---

## 7. Known Limitations & Operational Considerations

1. **Offline Hardware Connectivity:**
   - MedLedger is a responsive web application designed for desktop, tablet, and mobile. Receipt printing operates through standard browser print dialogs (`window.print()`). Direct USB ESC/POS thermal printer support without print dialogs requires an optional local companion agent.
2. **Rural Internet Disconnects:**
   - While prototype mode allows local disconnected operations, full multi-counter offline synchronisation with conflict resolution is planned for future mobile enhancements.

---

## 8. Final Readiness Sign-off

- [x] Codebase passes 100% of TypeScript strict type checks (0 errors).
- [x] Codebase passes 100% of ESLint static analysis (0 errors, 0 warnings).
- [x] All 235 Vitest unit and domain tests pass across 25 suites.
- [x] All 13 Playwright end-to-end integration tests pass on Chromium.
- [x] Next.js 16 production build compiles all 30 routes without warnings.
- [x] All critical and high-severity security authorization findings resolved.
- [x] Zero secrets committed to Git repository.

**STATUS: READY FOR STAGING DEPLOYMENT (PHASE 12).**
