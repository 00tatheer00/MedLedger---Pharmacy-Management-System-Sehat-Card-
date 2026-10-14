# MedLedger — Phase 3 Implementation Report: Database, Authentication & Security Foundation

> **Milestone:** Phase 3 — Database, Authentication & Security Foundation  
> **Date:** 2026-10-13  
> **Role:** Senior Backend Architect & Database Engineer  
> **Status:** Completed & Verified

---

## 1. Executive Summary

Phase 3 establishes the database, authentication, authorization, and audit infrastructure for MedLedger without introducing live mutations, premature hospital policies, or disrupting the existing Phase 2 dashboard.

All four version-controlled SQL migrations encompass the complete **28-table schema**, PostgreSQL **Row Level Security (RLS)** with default-deny semantics, database-level **immutability triggers** for audit logs and stock movements, and safe **development seed data**. The application layer integrates `@supabase/ssr`, `@supabase/supabase-js`, and `zod` with clean separation between client-safe and privileged server-side operations.

---

## 2. Preflight Findings & Baseline Audit

Before making changes, the repository was audited:

1. **Git State:** Working tree on `main` branch with Phase 2 UI implementation and refinements preserved. Zero commits were made without user instruction.
2. **Secrets Hygiene:** Verified `.gitignore` protects all `.env*` files except `.env.example`. No credentials, tokens, or live patient records exist in tracked files or Git history.
3. **Existing Quality Baseline:** Phase 2 dashboard and design system passed all Vitest unit tests, Playwright E2E tests, ESLint, Prettier, and Turbopack production builds.
4. **Toolchain Compatibility:** Confirmed `@supabase/supabase-js` (`^2.117.3`), `@supabase/ssr` (`^0.12.7`), and `zod` (`^4.6.7`) integrate cleanly with Next.js `16.4.0` (Turbopack) and React `19.3.0`.

---

## 3. Technology & Architecture Layering

MedLedger follows a **modular-monolith** pattern where infrastructure utilities reside strictly in `src/core/`:

```
src/core/
├── config/             # Runtime environment validation (Zod)
│   ├── env.ts
│   └── env.test.ts
├── database/           # Supabase client initializers & schema types
│   ├── client.ts
│   ├── client.test.ts
│   ├── schema-types.ts
│   └── migrations.test.ts
├── auth/               # Server session retrieval & authentication guards
│   ├── session.ts
│   └── index.ts
├── authorization/      # Server-enforced RBAC & permission checking
│   ├── roles.ts
│   ├── authorize.ts
│   └── roles.test.ts
├── audit/              # Immutable audit logging & payload sanitization
│   ├── audit-logger.ts
│   └── audit-logger.test.ts
└── errors/             # Typed ActionResult<T> & AppError definitions
    └── types.ts
```

### Client Security Invariants

- **`createBrowserClient()`**: Initializes client-side Supabase client using `@supabase/ssr` with public anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). Enforces RLS through the authenticated user's JWT.
- **`createServerClient()`**: Initializes server-side client using `@supabase/ssr` with async Next.js cookie adapters (`cookies()`). Used for Server Components, Server Actions, and Route Handlers.
- **`createServiceClient()`**: Initializes privileged admin client using `SUPABASE_SERVICE_ROLE_KEY`. Bypasses RLS.
  - **Fatal Security Guard:** Throws a runtime error if executed within a browser context (`typeof window !== 'undefined'`). Must never be imported into client components.

---

## 4. Database Schema Specification (28 Relational Tables)

The schema is organized into 9 domain groups across `supabase/migrations/20261013000001_core_schema.sql`:

| Domain Group                       | Tables Included                                                                                 | Key Schema Decisions & Integrity Constraints                                                                                                                                  |
| :--------------------------------- | :---------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Identity & RBAC**             | `profiles`, `roles`, `user_roles`, `permissions`, `role_permissions`                            | `profiles.id` mirrors `auth.users(id)` 1:1. User roles are database-backed. Client self-promotion is blocked via RLS.                                                         |
| **2. Patients & Admissions**       | `patients`, `admissions`                                                                        | `patients.mr_number` has a partial unique index (`WHERE deleted_at IS NULL`). `admissions.status` checked via SQL enum check.                                                 |
| **3. Medicine Master & Inventory** | `medicines`, `medicine_batches`, `stock_movements`                                              | `medicine_batches.quantity_on_hand` is non-negative (`CHECK (quantity_on_hand >= 0)`). `stock_movements` is an immutable operational ledger.                                  |
| **4. Prescriptions**               | `prescriptions`, `prescription_items`                                                           | Prescription line items enforce `CHECK (dispensed_quantity <= prescribed_quantity)`.                                                                                          |
| **5. Dispensing**                  | `dispensing_records`, `dispensing_items`                                                        | `dispensing_items.dispensed_medicine_id` explicitly records the dispensed catalogue item to **preserve substitution traceability** when generic alternatives are provided.    |
| **6. Suppliers & Purchasing**      | `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items` | Partial unique index on `suppliers(ntn_number)` and `purchase_orders(po_number)` (`WHERE deleted_at IS NULL`).                                                                |
| **7. Supplier Payables**           | `supplier_invoices`, `supplier_payments`                                                        | Foreign keys enforce payment voucher linkage. Monetary fields use `NUMERIC(12, 2)`.                                                                                           |
| **8. Hospital Claims & Billing**   | `claims`, `claim_items`, `claim_approvals`, `claim_payments`                                    | `claim_items.dispensing_item_id` provides **direct line-item fulfillment linkage** to dispensing items. Prevents double-claiming via `UNIQUE (claim_id, dispensing_item_id)`. |
| **9. Cross-Cutting**               | `audit_events`, `notifications`, `system_config`                                                | `audit_events` is immutable. `system_config` stores configurable rates, inventory thresholds, and hospital metadata.                                                          |

---

## 5. Security & Row Level Security (RLS) Policies

All 28 tables have **Row Level Security enabled** (`ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`) in `supabase/migrations/20261013000002_rls_policies.sql`.

### 5.1 Security Helper Functions

- `get_user_roles(user_uuid UUID)`: Retrieves active assigned roles from `user_roles JOIN roles`.
- `has_role(required_role TEXT)`: Returns true if caller possesses the role or is `system_admin`.
- `has_any_role(required_roles TEXT[])`: Returns true if caller possesses any matching role or is `system_admin`.
- `auth_is_admin()`: Returns true if caller is `system_admin`.

### 5.2 Provisional Role Permissions Matrix

| Provisional Role       | Read Access                                                           | Mutation / Write Access                                                        | Excluded / Prohibited                                        |
| :--------------------- | :-------------------------------------------------------------------- | :----------------------------------------------------------------------------- | :----------------------------------------------------------- |
| **`system_admin`**     | Universal                                                             | Universal (user management, roles, system configuration)                       | Bound by immutability triggers (cannot edit audit trails)    |
| **`pharmacy_manager`** | Full clinical, inventory, claims, audit trails                        | Patients, prescriptions, dispensing, inventory adjustments, purchase orders    | Cannot self-grant system administrator role                  |
| **`pharmacist`**       | Patients, prescriptions, medicines, inventory                         | Patient registration, prescription items, dispensing records, stock deductions | Cannot access supplier payments or edit system configuration |
| **`purchasing_staff`** | Medicines, inventory, suppliers, purchase orders                      | Suppliers, purchase orders, goods receipt notes (GRN)                          | Cannot dispense medicines or modify patient data             |
| **`finance_staff`**    | Claims, supplier invoices, dispensing line items (for reconciliation) | Claims compilation, claim submissions, invoice payment vouchers                | Cannot dispense drugs or adjust warehouse stock              |

### 5.3 Anti-Self-Promotion Controls

The `profiles_update_own_or_admin` policy ensures that regular authenticated users can update limited personal details (`full_name`, `phone`) on their own row, but **cannot modify** `is_active`, `email`, or `id`, and cannot insert into `user_roles`.

---

## 6. Audit Foundation & Immutability Triggers

Implemented in `supabase/migrations/20261013000003_audit_triggers.sql`:

1. **Audit Immutability Trigger (`prevent_audit_tampering`)**:
   - Attached to `BEFORE UPDATE OR DELETE ON audit_events`.
   - Raises a database exception if any update or deletion is attempted:  
     `RAISE EXCEPTION 'Audit records are immutable and cannot be modified or deleted.'`
2. **Stock Movement Immutability Trigger (`prevent_stock_movement_tampering`)**:
   - Attached to `BEFORE UPDATE OR DELETE ON stock_movements`.
   - Mandates that stock adjustments must be recorded as compensatory movements, never in-place row edits.
3. **Payload Credential Redaction**:
   - Application-level sanitizer `sanitizeAuditData()` recursively redacts `password`, `token`, `secret`, `api_key`, `pin`, and `service_role` keys before writing audit payloads.

---

## 7. Migration & Seed Strategy

Version-controlled migrations located in `supabase/migrations/`:

- `20261013000001_core_schema.sql` (Schema, foreign keys, check constraints, partial indexes)
- `20261013000002_rls_policies.sql` (Default-deny RLS, helper functions, role policies)
- `20261013000003_audit_triggers.sql` (Immutability triggers, auto-timestamp updates)
- `20261013000004_seed_dev_data.sql` (Fictional development seed data for local evaluation)

### Development vs Production Hygiene

- The seed script is explicitly tagged: `PROTOTYPE & LOCAL DEVELOPMENT SEED ONLY. DO NOT EXECUTE IN PRODUCTION.`
- Seed records use deterministic fictional UUIDs (`a0000000-...`, `b0000000-...`) for repeatable local testing.
- No real DHQ Hospital Kohat patient records, CNICs, or financial amounts exist in the repository.

---

## 8. Supabase Environment Setup Guide

To connect a live Supabase project when ready:

1. **Create Supabase Project:**
   - Log in to the [Supabase Dashboard](https://supabase.com/dashboard) and create a new project (e.g., `medledger-dhq-kohat`).
   - Select a secure database password and record it in a password manager.
2. **Retrieve API Credentials:**
   - Navigate to **Project Settings → API**.
   - Copy the **Project URL** (`https://<project-ref>.supabase.co`).
   - Copy the **`anon` public key**.
   - Copy the **`service_role` secret key** (keep secure; never expose to client code).
3. **Configure Local Environment:**
   - In `t:\DHQ KOhat Project\medledger`, populate `.env.local`:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
     SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     NEXT_PUBLIC_APP_ENV=development
     AUTH_SECRET=<generate-strong-random-secret>
     ```
4. **Apply Migrations:**
   - Install Supabase CLI: `npx supabase login`
   - Link project: `npx supabase link --project-ref <your-project-ref>`
   - Push migrations: `npx supabase db push`
5. **Verify Connection:**
   - Run `npm run test` to verify client initializers connect successfully.

---

## 9. Verification & Automated Test Results

All quality checks were executed against the codebase:

| Verification Suite       | Command                |  Result  | Details                                           |
| :----------------------- | :--------------------- | :------: | :------------------------------------------------ |
| **Vitest Unit Tests**    | `npm run test`         | **PASS** | **11 test files passed, 50 tests passed (50/50)** |
| **Playwright E2E Tests** | `npm run test:e2e`     | **PASS** | **4 tests passed (4/4)** on Chromium              |
| **TypeScript Typecheck** | `npm run typecheck`    | **PASS** | `tsc --noEmit` exited with code 0                 |
| **ESLint**               | `npm run lint`         | **PASS** | 0 errors, 0 warnings                              |
| **Prettier Formatting**  | `npm run format:check` | **PASS** | All matched files use Prettier style              |
| **Turbopack Build**      | `npm run build`        | **PASS** | Static prerender of all 15 routes succeeded       |

---

## 10. Strict Scope Boundaries & Unresolved Domain Items

### Preserved Scope

- The Phase 2 UI dashboard, navigation, quick actions, priority alerts, inventory breakdown, and evaluation banner remain **100% functional and preserved**.
- Prototype pages display honest Phase 2/3 notices.

### Items Explicitly NOT Implemented in Phase 3

- Real medicine dispensing mutations (belongs to Phase 4/5).
- Live stock deduction transactions (belongs to Phase 4).
- Purchase processing and invoice payment executions (belongs to Phase 6).
- Claim reimbursement rate calculations (belongs to Phase 7).
- Live hospital patient ingestion or production deployment.

### Remaining Unconfirmed Hospital Policies (Awaiting Client Confirmation)

1. **OQ-001 (Claim Rate Structure):** Schema supports configurable rates; the exact formula (fixed rate, cost markup, or slab rate) remains open.
2. **OQ-002 (Claim Approval Workflow):** Schema supports single-stage or multi-stage approvals; hospital sign-off levels remain unconfirmed.
3. **OQ-003 (Final Role Definitions):** The 5 provisional roles are enforced; final dual-authorization or hospital hierarchy rules remain open.
