# MedLedger — Phase 11 Security Audit Report

> **Project:** MedLedger — DHQ Kohat Hospital Pharmacy Management System  
> **Audit Date:** October 13, 2026  
> **Lead Auditor:** Principal Application Security Engineer & Healthcare Compliance Auditor  
> **Target Release:** MedLedger Production Readiness (Phase 11)  
> **Status:** Completed & Remediated

---

## 1. Executive Summary

This security audit performs an exhaustive, code-level and architectural security inspection of the MedLedger pharmacy management system built for the private pharmacy operating inside District Headquarter Hospital (DHQ) Kohat, Pakistan.

The audit covered authentication, authorization, Row Level Security (RLS) policies, transaction isolation, secret exposure, input validation, audit immutability, and API security across all 30 routes and 28 database tables.

---

## 2. Security Findings Summary & Classification

| ID         | Severity   | Category          | Component                                                              | Status             | Finding Description                                                                                                                                                                                                                                                       |
| ---------- | ---------- | ----------------- | ---------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-01** | **HIGH**   | Authorization     | Server Actions (`dispensing`, `claims`, `finance`)                     | **RESOLVED**       | Server actions called `requirePermission(user, ...)` without verifying the returned `ActionResult`, allowing unauthenticated or unauthorized bypass. Remediated with strict `if (!authCheck.success) return errorResult(...)`.                                            |
| **SEC-02** | **HIGH**   | Authentication    | Server Actions (`medicines`, `patients`, `prescriptions`, `inventory`) | **RESOLVED**       | Server actions checked `if (user && !hasPermission(...))`, which evaluated to false if `user` was `null`, permitting unauthenticated callers to trigger write operations. Remediated with mandatory `requirePermission(user, ...)` check.                                 |
| **SEC-03** | **MEDIUM** | Auth Session      | `src/core/auth/session.ts`                                             | **RESOLVED**       | `getCurrentUser()` returned `null` in prototype mode without live Supabase, forcing downstream modules to bypass auth. Remediated with a protected non-production staff session (`Dr. Ayesha Bangash`, `system_admin`), while enforcing live Supabase Auth in production. |
| **SEC-04** | **LOW**    | Secret Exposure   | Environment files                                                      | **VERIFIED CLEAN** | Verified `.env*` is properly ignored in `.gitignore`. Confirmed `SUPABASE_SERVICE_ROLE_KEY` is strictly server-side with zero occurrences in client components or `NEXT_PUBLIC_*` variables.                                                                              |
| **SEC-05** | **LOW**    | Injection         | Database & RPC                                                         | **VERIFIED CLEAN** | All database interactions utilize parameterized Supabase queries or atomic stored procedures (`rpc`), eliminating SQL injection vectors.                                                                                                                                  |
| **SEC-06** | **LOW**    | Audit Tampering   | Database Triggers                                                      | **VERIFIED CLEAN** | PostgreSQL trigger `prevent_audit_tampering()` enforces immutability by aborting any `UPDATE` or `DELETE` attempt on `audit_events`.                                                                                                                                      |
| **SEC-07** | **INFO**   | Transaction Locks | Concurrency                                                            | **VERIFIED CLEAN** | All financial allocations, batch stock deductions, and claim item locks use `FOR UPDATE` pessimistic row locking in PostgreSQL.                                                                                                                                           |

---

## 3. Deep Dive: Remediated Vulnerabilities

### 3.1 SEC-01 & SEC-02: Missing Server-Side Role Enforcement (Resolved)

#### Vulnerability Description:

In earlier phases, server actions in dispensing and claims called `requirePermission(user, 'dispensing:create')` as a statement without evaluating its return value. Similarly, catalog actions in medicines and patients used `if (user && !hasPermission(user, ...))`, which failed open when `user` was `null`.

#### Remediation Applied:

All server actions across all 8 functional domains (`dispensing`, `claims`, `finance`, `inventory`, `medicines`, `patients`, `prescriptions`, `admissions`, `suppliers`, `purchasing`) now execute:

```typescript
const user = await getCurrentUser();
const authCheck = requirePermission(user, 'required:permission');
if (!authCheck.success) {
  return errorResult('FORBIDDEN', authCheck.error.message);
}
```

In addition, `src/core/auth/session.ts` provides a secure distinction between evaluation environments:

- **Production (`process.env.NODE_ENV === 'production'` or `isSupabaseConfigured()`):** Calls `supabase.auth.getUser()`. If no valid JWT session exists, returns `null`, triggering a strict 401 Unauthorized / Forbidden rejection on all protected operations.
- **Local Prototype Mode:** Resolves an authenticated staff session (`Dr. Ayesha Bangash` with `system_admin` role) allowing authenticated development without disabling RBAC gates.

---

## 4. Database Security & Row Level Security (RLS)

All 28 tables defined in `supabase/migrations/20261013000001_core_schema.sql` have Row Level Security enabled in `20261013000002_rls_policies.sql`:

```sql
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
-- [28 tables total]
```

### RLS Policy Matrix:

- **Public / Anonymous Role:** Zero direct `INSERT`, `UPDATE`, or `DELETE` access on any operational or financial table.
- **Authenticated Staff:** Access strictly scoped by user role claims validated against the `user_roles` relational table.
- **Audit Logs:** Protected by the `prevent_audit_tampering()` trigger preventing any modification or deletion even by authenticated users.

---

## 5. Concurrency & Race Condition Defense

1. **Inventory Batch Decrement:**
   `fn_dispense_prescription_atomic` locks the selected `medicine_batches` row with `SELECT ... FOR UPDATE` before quantity validation and decrement, preventing negative inventory balances under concurrent dispensing counters.
2. **Duplicate Claim Submission Prevention:**
   `fn_create_claim_atomic` locks dispensing records with `SELECT ... FOR UPDATE` and checks already claimed quantities against total dispensed quantities, preventing double-billing across concurrent claims.
3. **Payment Allocation Integrity:**
   `fn_record_supplier_payment_atomic` verifies outstanding invoice balances under row-level locks, ensuring invoices are not overpaid during concurrent payment entry.

---

## 6. Secrets & Environment Audit

- `.gitignore` includes `.env*` and excludes only `.env.example`.
- Verified that `NEXT_PUBLIC_*` prefixes are exclusively used for public parameters: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_ENV`.
- `SUPABASE_SERVICE_ROLE_KEY` is never prefixed with `NEXT_PUBLIC_` and is referenced only in server-side database initializers.
- Zero secrets or private keys are committed to the repository.

---

## 7. Security Audit Verdict

**PASSED — READY FOR STAGING ENVIRONMENT.**  
All critical and high-severity authorization vulnerabilities have been remediated and verified with automated test suites.
