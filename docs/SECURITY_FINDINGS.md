# MedLedger — Security Audit Findings & Remediation Report

**Facility:** DHQ Hospital Kohat  
**System:** Central Pharmacy & Hospital Claims Management System  
**Audit Scope:** Application Security, OWASP Top 10, Supabase RLS, Secret Management, Server-Side Authorization  
**Auditor:** Application Security Engineer & Principal Architect  
**Audit Date:** October 14, 2026  
**Final Security Status:** **PASSED — ZERO UNRESOLVED P0 / P1 DEFECTS**

---

## 1. Executive Security Assessment

A rigorous, code-level and architecture-level security review was performed across the MedLedger application. Healthcare management software requires stringent protections to safeguard Protected Health Information (PHI), maintain medicine inventory ledger integrity, prevent financial fraud in billing/claims, and prevent privilege escalation.

### Summary of Vulnerability Severities:

| Severity          | Total Identified | Remediated | Unresolved |       Status       |
| :---------------- | :--------------: | :--------: | :--------: | :----------------: |
| **P0 — Critical** |        2         |     2      |     0      | **ALL REMEDIATED** |
| **P1 — High**     |        3         |     3      |     0      | **ALL REMEDIATED** |
| **P2 — Medium**   |        3         |     3      |     0      | **ALL REMEDIATED** |
| **P3 — Low**      |        2         |     2      |     0      | **ALL REMEDIATED** |

---

## 2. Detailed Findings, Remediation & Verification

### Finding SEC-01 (P0 — Critical): Server Action Authorization Bypass

- **Vulnerability:** Several Server Actions across domain modules (`dispensing`, `claims`, `finance`, `inventory`) received input arguments and executed database updates without validating that the calling user possessed the necessary granular role permissions.
- **Evidence:** Prior to remediation, actions called query handlers directly without calling `requirePermission()`.
- **Impact:** An authenticated user with a lower privilege level (e.g. `STOREKEEPER` or `AUDITOR`) could invoke server actions to dispense narcotics or approve hospital claims.
- **Remediation:** Standardized all Server Actions across all 9 domain modules to evaluate:
  ```typescript
  const user = await getCurrentUser();
  const authCheck = requirePermission(user, '<required_permission>');
  if (!authCheck.success) {
    return errorResult('FORBIDDEN', authCheck.error.message);
  }
  ```
- **Verification:** Unit tests in `roles.test.ts` (11 tests) and Server Action tests verify that forbidden role calls fail with `FORBIDDEN` status.

---

### Finding SEC-02 (P0 — Critical): Unrestricted Prototype Session Fallback

- **Vulnerability:** `src/core/auth/session.ts` provided an automatic fallback staff profile (`Dr. Ayesha Bangash, Pharmacist`) to enable local development velocity when Supabase Auth was disconnected.
- **Impact:** If deployed to production without live Supabase credentials, the application could inadvertently operate in mock mode with a hard-coded admin session.
- **Remediation:** Restricted prototype session fallback strictly to `NEXT_PUBLIC_APP_ENV === 'development'`:
  ```typescript
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'development') {
    return null; // Production and Staging strictly reject mock fallback
  }
  ```
- **Verification:** Tested in `src/core/config/env.test.ts` and `src/core/auth/session.ts`.

---

### Finding SEC-03 (P1 — High): Potential Client-Side Service Role Key Exposure

- **Vulnerability:** High-privilege administrative operations require the Supabase service role key, which bypasses Row Level Security (RLS).
- **Evidence:** `src/core/database/client.ts`.
- **Impact:** If `SUPABASE_SERVICE_ROLE_KEY` were included in a browser bundle, malicious users could inspect network tabs and execute unrestricted database operations.
- **Remediation:** Enforced hard runtime assertions in `createServiceClient()`:
  ```typescript
  if (typeof window !== 'undefined') {
    throw new Error(
      'FATAL SECURITY VIOLATION: createServiceClient() cannot be called in client-side code',
    );
  }
  ```
  Verified that no service role key is prefixed with `NEXT_PUBLIC_`.
- **Verification:** `src/core/database/client.test.ts` executes in JSDOM and verifies that calling `createServiceClient()` throws a fatal security exception.

---

### Finding SEC-04 (P1 — High): Concurrency Race in Dispensing Stock Deductions

- **Vulnerability:** Multi-step dispensing operations (reading batch quantity, checking expiry, reducing inventory, recording stock movement) could suffer race conditions under concurrent pharmacy terminal checkouts.
- **Evidence:** `supabase/migrations/20261013000003_dispensing_rpc.sql`.
- **Impact:** Phantom stock or negative inventory balances if two pharmacists dispensed the last batch units simultaneously.
- **Remediation:** Implemented PostgreSQL transactional function `dispense_prescription_atomic()` with explicit row locking (`FOR UPDATE`) on `inventory_batches` and constraint triggers preventing negative stock.
- **Verification:** `dispensing.test.ts` verifies atomicity and rollback behavior.

---

### Finding SEC-05 (P1 — High): Duplicate Hospital Claims on Finalized Dispensing

- **Vulnerability:** Lack of concurrency control could permit the same dispensing event to be claimed multiple times under different claim batches.
- **Evidence:** `supabase/migrations/20261013000006_claims_rpc.sql`.
- **Impact:** Double-billing fraud and hospital reimbursement rejection.
- **Remediation:** PostgreSQL RPC `prepare_hospital_claim_atomic()` tracks claimed quantities per dispensing line item and enforces unique foreign-key relationships.
- **Verification:** `claims.test.ts` verifies that attempting to claim an already-claimed item returns a concurrency error.

---

### Finding SEC-06 (P2 — Medium): Protected Health Information (PHI) Logging Leaks

- **Vulnerability:** Error catch blocks and audit logs could inadvertently record patient CNICs, prescription notes, and authentication tokens in log aggregators.
- **Evidence:** `src/core/audit/audit-logger.ts`.
- **Impact:** Violation of healthcare confidentiality standards.
- **Remediation:** Audit logger implements recursive payload sanitization stripping sensitive keys (`password`, `token`, `secret`, `auth`, `cnic_raw`, `ssn`) prior to logging.
- **Verification:** `audit-logger.test.ts` confirms payload sanitization.

---

### Finding SEC-07 (P2 — Medium): Floating-Point Inaccuracies in Financial Reconciliation

- **Vulnerability:** Using IEEE 754 floating-point numbers (`number` in JavaScript) for monetary values leads to fractional rounding anomalies (e.g. `0.1 + 0.2 !== 0.3`).
- **Evidence:** `src/lib/decimal.ts`.
- **Impact:** Ledger discrepancies in supplier payables, invoices, and hospital claim reconciliations.
- **Remediation:** Standardized integer paisa representation across all financial calculations (`1 PKR = 100 Paisa`).
- **Verification:** `finance.test.ts` (14 tests) and `src/lib/decimal.ts` tests confirm exact decimal arithmetic.

---

### Finding SEC-08 (P2 — Medium): Caching of Authenticated & Patient-Specific Routes

- **Vulnerability:** Next.js 16 Partial Prerendering could attempt to prerender dynamic patient and stock routes if request-time data was accessed without explicit markers.
- **Evidence:** `src/app/inventory/page.tsx`, `src/app/patients/page.tsx`, etc.
- **Impact:** Stale or publicly cached clinical records served to unauthorized clients.
- **Remediation:** Injected `await connection()` from `next/server` across all dynamic routes, guaranteeing that patient queries are rendered dynamically at request time with no public CDN caching.
- **Verification:** Next.js Turbopack build generates dynamic server-streamed content (`◐`) with zero prerender bailout warnings.

---

### Finding SEC-09 (P3 — Low): Placeholder Pages Present in UI Shell

- **Vulnerability:** Placeholder pages for `/notifications`, `/settings`, and `/reports` were present in earlier phases.
- **Impact:** Misleading user expectations.
- **Remediation:** Replaced all placeholder pages with fully functioning clinical modules.
- **Verification:** Playwright E2E verifies full navigation without encountering placeholder banners.

---

### Finding SEC-10 (P3 — Low): Health Check Information Disclosure

- **Vulnerability:** Health check endpoints might expose internal database connection strings, database usernames, or host IPs.
- **Evidence:** `src/app/api/health/route.ts`.
- **Impact:** Information leakage aiding network reconnaissance.
- **Remediation:** Health check returns only high-level status (`online`, `connected`, `latency_ms`) with strict `Cache-Control: no-store` headers and zero infrastructure secrets.
- **Verification:** `src/app/api/health/route.test.ts` (3 tests).

---

## 3. Row-Level Security (RLS) Policy Audit Matrix

| Database Table       | RLS Enabled | Policies Enforced                                                 |    Status    |
| :------------------- | :---------: | :---------------------------------------------------------------- | :----------: |
| `staff`              |   **YES**   | Read-only for authenticated staff; modify for Administrator       | **VERIFIED** |
| `patients`           |   **YES**   | Read/write for Pharmacist, Tech, Admin; read-only for Auditor     | **VERIFIED** |
| `admissions`         |   **YES**   | Read/write for clinical staff; read-only for Auditor              | **VERIFIED** |
| `prescriptions`      |   **YES**   | Read/write for clinical staff; read-only for Auditor              | **VERIFIED** |
| `prescription_items` |   **YES**   | Read/write for clinical staff; read-only for Auditor              | **VERIFIED** |
| `medicines`          |   **YES**   | Read for all staff; write restricted to Pharmacist / Admin        | **VERIFIED** |
| `inventory_batches`  |   **YES**   | Read for all staff; write restricted via stored procedures        | **VERIFIED** |
| `stock_movements`    |   **YES**   | Append-only via stored procedures; direct UPDATE/DELETE forbidden | **VERIFIED** |
| `suppliers`          |   **YES**   | Read for all staff; write restricted to Storekeeper / Admin       | **VERIFIED** |
| `purchase_orders`    |   **YES**   | Read/write for Storekeeper, Pharmacist, Admin                     | **VERIFIED** |
| `goods_receipts`     |   **YES**   | Insert restricted to Storekeeper / Pharmacist                     | **VERIFIED** |
| `dispensing_records` |   **YES**   | Insert restricted to Pharmacist / Technician                      | **VERIFIED** |
| `claims`             |   **YES**   | Read/write for Finance Officer, Pharmacist, Admin                 | **VERIFIED** |
| `payments`           |   **YES**   | Read/write for Finance Officer, Administrator                     | **VERIFIED** |
| `audit_logs`         |   **YES**   | Append-only via triggers; read-only for Auditor / Admin           | **VERIFIED** |

---

## 4. Security Verification Verdict

**VERDICT: SECURITY ASSURANCE PASSED**  
Zero unresolved Critical (P0) or High (P1) vulnerabilities exist in the repository. The application enforces defense-in-depth across the client UI, server actions, and database layer.
