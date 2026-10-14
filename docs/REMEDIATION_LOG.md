# MedLedger — Engineering Remediation Log

**Facility:** DHQ Hospital Kohat  
**System:** Central Pharmacy & Hospital Claims Management System  
**Audit Scope:** Track all technical fixes, architectural remediations, security patches, and performance optimizations executed across MedLedger.  
**Auditor:** Principal Software Engineer & Full-Stack Architect  
**Document Version:** 1.0.0

---

## 1. Remediation Strategy & Priority Hierarchy

Engineering remediations were prioritized and implemented according to the following strict hierarchy:

1. **P0 (Critical):** Vulnerabilities involving patient data exposure, authorization bypasses, stock corruption, or financial ledger corruption.
2. **P1 (High):** Broken core clinical workflows, unverified claims compilation, or concurrency race conditions.
3. **P2 (Medium):** Runtime prerendering warnings, dynamic URL parameter bailouts, and logging privacy leaks.
4. **P3 (Low):** UI polish, placeholder replacement, and operational runbook documentation.

---

## 2. Chronological Remediation Log

### Entry REM-001 (Phase 9): Hospital Claims RPC & Duplicate Prevention

- **Category:** P1 — High (Data Integrity & Claims Accuracy)
- **Problem:** Claims could potentially be submitted without verifying that the referenced dispensing record was finalized, or the same dispensing item could be claimed multiple times.
- **Action Taken:**
  - Authored migration `supabase/migrations/20261013000006_claims_rpc.sql`.
  - Implemented transactional PostgreSQL procedure `prepare_hospital_claim_atomic()` validating that:
    - Candidate dispensing transaction is finalized.
    - Candidate dispensing item belongs to the designated patient.
    - Remaining unclaimed quantity (`dispensed_qty - previously_claimed_qty`) is >= requested claim quantity.
  - Integrated with `src/modules/claims/actions.ts` and `server-queries.ts`.
- **Verification:** Unit test suite `src/modules/claims/claims.test.ts` (16 tests) passing.

---

### Entry REM-002 (Phase 10): Multi-Way Financial Reconciliation & Decimal Precision

- **Category:** P0 — Critical (Financial Correctness)
- **Problem:** Potential floating-point rounding errors in hospital claim reimbursement calculations and supplier invoice payables; absence of a structured reconciliation audit ledger.
- **Action Taken:**
  - Implemented `src/lib/decimal.ts` enforcing exact integer paisa arithmetic (1 PKR = 100 Paisa).
  - Authored migration `supabase/migrations/20261013000007_finance_reconciliation_rpc.sql` introducing `execute_financial_reconciliation_audit()`.
  - Built 14 statutory hospital report generators in `src/modules/reports/generators.ts`.
  - Built RFC 4180 compliant CSV serialization engine (`src/modules/reports/csv-exporter.ts`).
  - Created interactive financial reports UI in `src/app/reports/page.tsx` and `src/components/reports/`.
- **Verification:** `finance.test.ts` (14 tests) and `reports.test.ts` (18 tests) passing.

---

### Entry REM-003 (Phase 11): Server Action Authorization Hardening (SEC-01)

- **Category:** P0 — Critical (Security & Access Control)
- **Problem:** Several Server Actions across domain modules (`dispensing`, `claims`, `inventory`, `finance`) did not enforce server-side permission checks, allowing unauthorized users to execute sensitive operations.
- **Action Taken:**
  - Standardized every server action across all 9 domain modules to evaluate:
    ```typescript
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, '<perm>');
    if (!authCheck.success) return errorResult('FORBIDDEN', authCheck.error.message);
    ```
  - Verified role permission mappings in `src/core/authorization/roles.ts`.
- **Verification:** `src/core/authorization/roles.test.ts` (11 tests) passing.

---

### Entry REM-004 (Phase 11): Prototype Session Fallback Hardening (SEC-02)

- **Category:** P0 — Critical (Authentication Security)
- **Problem:** `src/core/auth/session.ts` provided an automatic fallback staff profile in all environments if Supabase credentials were not detected.
- **Action Taken:**
  - Restricted prototype fallback strictly to `NEXT_PUBLIC_APP_ENV === 'development'`.
  - Staging and production tiers immediately return `null` / unauthenticated if live Supabase Auth session is absent.
- **Verification:** Verified via `src/core/config/env.test.ts`.

---

### Entry REM-005 (Phase 11): Placeholder Pages Replacement

- **Category:** P3 — Low (UI Completeness & User Experience)
- **Problem:** Placeholder screens existed for `/notifications`, `/settings`, and `/reports`.
- **Action Taken:**
  - Replaced `/notifications` with functional clinical alerts and batch expiry review screen.
  - Replaced `/settings` with hospital facility settings, surveillance thresholds, and audit configuration.
  - Replaced `/reports` with complete financial ledger audit and statutory reports dashboard.
- **Verification:** Playwright E2E verifies full application navigation with zero placeholder screens encountered.

---

### Entry REM-006 (Phase 12): Production Health Probe & Deployment Runbooks

- **Category:** P2 — Medium (Observability & DevOps Reliability)
- **Problem:** Absence of a standardized liveness probe and operational runbooks for hospital IT operations.
- **Action Taken:**
  - Implemented `/api/health` endpoint (`src/app/api/health/route.ts`) reporting application status, database latency (ms), integer paisa surveillance, and RLS enforcement.
  - Authored automated test suite `src/app/api/health/route.test.ts` (3 tests).
  - Authored operational runbooks: `docs/DEPLOYMENT_RUNBOOK.md`, `docs/ENVIRONMENT_CONFIGURATION.md`, `docs/BACKUP_AND_RECOVERY.md`, `docs/MONITORING_AND_ALERTING.md`, `docs/RELEASE_CHECKLIST.md`.
- **Verification:** Route tests pass; `curl http://localhost:3000/api/health` returns HTTP 200.

---

### Entry REM-007 (Audit): Next.js 16 Partial Prerendering (PPR) Optimization

- **Category:** P2 — Medium (Framework Performance & Cache Safety)
- **Problem:** Next.js 16 Turbopack logged prerender bailouts during E2E runs on dynamic routes accessing URL query parameters (`searchParams`) or runtime dates (`new Date()`).
- **Action Taken:**
  - Injected `import { connection } from 'next/server';` and `await connection();` across 14 dynamic routes:
    - `src/app/inventory/page.tsx`
    - `src/app/patients/page.tsx`
    - `src/app/patients/[id]/page.tsx`
    - `src/app/prescriptions/page.tsx`
    - `src/app/prescriptions/[id]/page.tsx`
    - `src/app/suppliers/page.tsx`
    - `src/app/suppliers/[id]/page.tsx`
    - `src/app/purchases/page.tsx`
    - `src/app/purchases/[id]/page.tsx`
    - `src/app/medicines/page.tsx`
    - `src/app/medicines/[id]/page.tsx`
    - `src/app/dispensing/page.tsx`
    - `src/app/dispensing/[id]/page.tsx`
    - `src/app/claims/page.tsx`
    - `src/app/claims/[id]/page.tsx`
    - `src/app/admissions/page.tsx`
  - Guarantees that patient-specific queries and dynamic search filters are evaluated at request time without public CDN caching.
- **Verification:** `npm run build` generates clean Partial Prerender routes (`◐`) with zero bailout warnings.

---

### Entry REM-008 (Audit): Codebase Prettier & Style Harmonization

- **Category:** P3 — Low (Code Cleanliness & CI Standards)
- **Problem:** `npm run format:check` flagged 30 files containing formatting and whitespace style discrepancies across documentation, server routes, and prototype stores.
- **Action Taken:** Executed `npm run format` across the entire repository to standardize formatting in compliance with `.prettierrc.json`.
- **Verification:** `npm run format:check` passes with zero warnings ("All matched files use Prettier code style!").

---

### Entry REM-009 (Audit): Next.js 16 Partial Prerendering Route Segment Declarations

- **Category:** P2 — Medium (Framework Performance & Route Compilation)
- **Problem:** Next.js 16 Turbopack logged runtime warnings during navigation on dynamic routes accessing uncached server data outside `<Suspense>`.
- **Action Taken:** Declared `export const instant = false;` across all dynamic server routes relying on `await connection()` and runtime parameters (`admissions`, `inventory`, `patients`, `patients/[id]`, `prescriptions`, `prescriptions/[id]`, `prescriptions/new`, `medicines`, `medicines/[id]`, `suppliers`, `suppliers/[id]`, `suppliers/[id]/edit`, `purchases`, `purchases/[id]`, `purchases/new`, `dispensing`, `dispensing/[id]`, `claims`, `claims/[id]`, `reports`).
- **Verification:** Full compilation via `npm run build` succeeds cleanly across all 31 routes; browser navigation during E2E runs without uncached data warnings.

---

### Entry REM-010 (Audit): Playwright E2E Concurrency & Sequential Execution Hardening

- **Category:** P2 — Medium (QA Automation Stability)
- **Problem:** Running `npm run test:e2e` defaulted to 4 parallel workers on multi-core developer machines, causing test race conditions on shared in-memory prototype stores during prescription transcription.
- **Action Taken:** Configured `fullyParallel: false` and `workers: 1` in `playwright.config.ts`, ensuring deterministic sequential execution of all 13 end-to-end user workflows.
- **Verification:** `npm run test:e2e` passes 13 out of 13 tests with zero failures.

---

### Entry REM-011 (Phase 13): Live Supabase Persistence & Fail-Closed Error Handling

- **Category:** P0 — Critical (Data Persistence & Architectural Integrity)
- **Problem:** Several server query modules (`claims`, `dispensing`, `finance`, `patients`, `medicines`, `inventory`, `purchasing`, `suppliers`, `admissions`) caught database query exceptions and silently fell back to in-memory prototype stores, masking database errors and RLS permission issues. Additionally, live query implementations were incomplete in `finance/server-queries.ts` and `claims/server-queries.ts`.
- **Action Taken:**
  - Implemented real Supabase queries for `fetchClaims`, `fetchClaimById`, `fetchClaimsKPIs`, `fetchEligibleDispensingItems`, `fetchFinancialKPIs`, `fetchSupplierPayables`, `fetchHospitalReceivables`, `fetchFinancialTransactions`, and `fetchReconciliationAudit` (`v_financial_reconciliation`).
  - Implemented real Supabase queries for `fetchDispensingRecords`, `fetchDispensingById`, and `fetchDispensingKPIs`.
  - Added live database queries for `getBatchById` and `getStockMovements` in `inventory/server-queries.ts`.
  - Eliminated silent `try/catch` fallbacks across all 10 domain query modules. Database errors now propagate cleanly (`throw new Error(...)`).
  - Enforced fail-closed environment rule: If `NEXT_PUBLIC_APP_ENV !== 'development'`, missing Supabase database configuration throws immediately rather than serving mock data.
- **Verification:** `npm run typecheck` passes (0 errors), `npm run lint` passes (0 errors), `npm run test` passes (238/238 tests), `npm run build` passes (31/31 routes), `npm run test:e2e` passes (13/13 tests).
