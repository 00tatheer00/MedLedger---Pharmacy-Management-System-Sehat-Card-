# MedLedger — Deployment Runbook

**Facility:** DHQ Hospital Kohat  
**System:** Pharmacy & Hospital Claims Management System  
**Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Supabase PostgreSQL with RLS  
**Status:** Staging Ready (Infrastructure verification: Local/Self-Contained PASS, Cloud Remote Provisioning: NOT TESTED pending cloud access)

---

## 1. Scope & Objective

This runbook establishes deterministic, auditable, and repeatable procedures for deploying MedLedger to Staging and Production environments. It strictly enforces separation of concerns, database migration safety, role-based authorization integrity, and emergency rollback procedures.

---

## 2. Environments & Deployment Targets

| Environment                | Host Platform                          | Database Cluster                   | Domain / URL                                         | Purpose                                               |
| :------------------------- | :------------------------------------- | :--------------------------------- | :--------------------------------------------------- | :---------------------------------------------------- |
| **Local Dev**              | Local Node 20+ (`npm run dev`)         | Local Supabase / Mock              | `http://localhost:3000`                              | Feature development & prototyping                     |
| **CI / Automated Testing** | GitHub Actions / Vitest / Playwright   | In-Memory / Ephemeral DB           | `http://localhost:3000`                              | Automated gate validation (lint, types, tests, build) |
| **Staging**                | Vercel / Node Container                | Supabase Dedicated Staging Project | `https://staging.medledger.dhqkohat.gov.pk` (Target) | Pre-flight validation, clinical smoke testing, UAT    |
| **Production**             | Vercel Enterprise / Secure Self-Hosted | Supabase High-Availability Cluster | `https://medledger.dhqkohat.gov.pk` (Target)         | Live clinical dispensing, inventory, claims & billing |

> **Operational Notice:** Live cloud deployments to remote hosts have **NOT BEEN EXECUTED** in this phase because external production credentials and DNS management remain under DHQ Kohat IT governance. This runbook documents the exact, verified deployment instructions.

---

## 3. Preflight Quality Gates

Before initiating any deployment to Staging or Production, all local quality gates must exit with code `0`:

```bash
# 1. Type Check (strict TypeScript, zero errors)
npm run typecheck

# 2. Code Linting (ESLint 9 flat config, zero warnings/errors)
npm run lint

# 3. Comprehensive Test Suite (Vitest, 26 suites, 238 tests)
npm test

# 4. Production Next.js Build (Turbopack, cache components validation)
npm run build

# 5. Playwright E2E Smoke Suite (Workers=1 against dev/staging)
npx playwright test --workers=1
```

If any command fails, deployment is aborted immediately.

---

## 4. Staging Deployment Procedure

### Step 4.1: Repository & Branch Cleanliness

1. Ensure the working tree is clean and checked out to the target release tag or `main`:
   ```bash
   git status
   git rev-parse HEAD
   ```
2. Verify that no secrets, `.env`, or `.env.local` files are tracked in Git.

### Step 4.2: Staging Database Migration

1. Review pending migrations in `supabase/migrations/`:
   - `20261013000001_core_schema.sql` (baseline schema & roles)
   - `20261013000002_inventory_triggers.sql` (batch management & stock audit)
   - `20261013000003_dispensing_rpc.sql` (transactional dispensing & stock deduction)
   - `20261013000004_permissions_matrix.sql` (RBAC matrix & policy enforcement)
   - `20261013000005_audit_surveillance.sql` (immutable audit trails)
   - `20261013000006_claims_rpc.sql` (hospital claims & billing RPCs)
   - `20261013000007_finance_reconciliation_rpc.sql` (reconciliation & finance RPCs)
2. Link the Supabase CLI to the Staging project:
   ```bash
   supabase link --project-ref <STAGING_SUPABASE_PROJECT_REF>
   ```
3. Apply migrations to Staging:
   ```bash
   supabase db push
   ```
4. Confirm migration success by verifying PostgreSQL table structures and RPC functions.

### Step 4.3: Environment Variable Configuration

Configure the following environment variables in the Staging host settings (never checked into Git):

- `NEXT_PUBLIC_APP_ENV=staging`
- `NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>`
- `SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>` (Secret, server-only)
- `NEXT_PUBLIC_FACILITY_NAME="DHQ Hospital Kohat - Staging Environment"`

### Step 4.4: Deploy Application Artifact

- **If deploying via Vercel CLI:**
  ```bash
  vercel --prod --environment=staging
  ```
- **If deploying via Docker / Node Container:**
  ```bash
  docker build -t medledger:staging .
  docker run -d -p 3000:3000 --env-file .env.staging medledger:staging
  ```

### Step 4.5: Post-Deployment Smoke Verification

1. Probe health check:
   ```bash
   curl -i https://staging.medledger.dhqkohat.gov.pk/api/health
   ```
   **Expected Response:** HTTP 200, JSON `{ "status": "healthy", "database": { "status": "connected" } }`.
2. Execute automated browser smoke verification against the staging URL:
   ```bash
   PLAYWRIGHT_BASE_URL=https://staging.medledger.dhqkohat.gov.pk npx playwright test --workers=1
   ```

---

## 5. Production Deployment Procedure

Production deployments require explicit written approval from DHQ Kohat IT Directorate and Pharmacy Administration.

### Step 5.1: Pre-Deployment Briefing & Maintenance Window

- Schedule deployment during the designated low-utilization window (typically 02:00 - 04:00 PKT).
- Alert hospital night-supervisors of the 15-minute maintenance interval.
- Activate read-only maintenance notice if executing structural schema migrations.

### Step 5.2: Production Database Backup Check

- Verify that automated Point-In-Time Recovery (PITR) is active on the Supabase production instance.
- Take a manual snapshot before applying migrations:
  ```bash
  supabase db dump --project-ref <PROD_PROJECT_REF> -f backup_pre_release.sql
  ```

### Step 5.3: Production Migration Execution

1. Link to production project:
   ```bash
   supabase link --project-ref <PROD_PROJECT_REF>
   ```
2. Apply migrations in a single transactional batch:
   ```bash
   supabase db push
   ```

### Step 5.4: Deploy Code to Production

- Trigger production deployment via GitHub Release or Vercel production cutover:
  ```bash
  vercel --prod
  ```

### Step 5.5: Smoke Testing & Approval Sign-Off

1. Check `/api/health`.
2. Authenticate as authorized Clinical Administrator.
3. Verify patient list, catalogue, active admissions, dispensing logs, claims queue, and financial reports.
4. Verify audit logger logs the successful deployment health inspection.

---

## 6. Rollback & Forward-Fix Strategy

### Application Rollback

- In Vercel / Cloud Host: Instantly promote the previous successful deployment SHA from the dashboard or CLI:
  ```bash
  vercel rollback <PREVIOUS_DEPLOYMENT_URL>
  ```
- Instant rollback latency: < 30 seconds.

### Database Migration Rollback Strategy

- **Rule 1 (Zero Destructive Drops):** Database migrations must never execute `DROP TABLE` or `DROP COLUMN` on clinical data in production.
- **Rule 2 (Forward-Fix Preference):** In the event of a migration anomaly, write a compensating migration (e.g., `20261013000008_revert_feature.sql`) rather than attempting uncoordinated manual schema rollbacks.
- **Rule 3 (Full Restore):** In the catastrophic event of unrecoverable schema corruption, initiate Point-In-Time Recovery to the timestamp immediately preceding the deployment window (see `docs/BACKUP_AND_RECOVERY.md`).

---

## 7. Operational Verification Status

- [x] Local Build & Compilation: **VERIFIED (0 errors, 31 routes)**
- [x] Local Type Checking: **VERIFIED (0 errors)**
- [x] Local Unit Tests: **VERIFIED (26 suites, 238 tests passing)**
- [x] Health Check Endpoint: **VERIFIED (`/api/health` returns status & DB connectivity)**
- [ ] Cloud Hosting Deployment: **NOT TESTED** (Requires client-provisioned Vercel/Supabase production credentials)
- [ ] Production Traffic Cutover: **NOT TESTED** (Awaiting formal DHQ Kohat IT release window)
