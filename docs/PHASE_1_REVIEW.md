# MedLedger — Phase 1 Independent Engineering Review

> **Review Date:** 2026-10-13  
> **Reviewer:** Principal Software Engineer (Independent Review)  
> **Target Scope:** Phase 1 Foundation, Technical Documentation, Codebase Initialization, and Quality Pipeline  
> **Repository:** `medledger` (`origin/main`)

---

## 1. Executive Verdict

### **Verdict: PASS WITH CONDITIONS**

The Phase 1 foundation demonstrates strong architectural forethought, modular domain separation, and a modern TypeScript/Next.js engineering baseline. The documentation across all eight architectural records is thorough, well-structured, and explicitly acknowledges domain uncertainties. All automated quality gates (type checking, linting, formatting, unit tests, end-to-end tests, and production build) pass with zero warnings or errors.

However, **progression to Phase 2 (Design System & Dashboard UI)** is contingent upon resolving critical documentation drifts, phase alignment ambiguities, and preliminary database integrity gaps.

### Summary Scorecard

| Area                               | Status         | Key Observation                                                                                        |
| ---------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| **Architectural Documentation**    | 🟢 PASS        | 8 comprehensive documents covering architecture, security, standards, and open questions.              |
| **Tooling & CI/CD Pipeline**       | 🟢 PASS        | TypeScript strict mode, ESLint 9, Prettier, Husky, Vitest, Playwright, and GitHub Actions functional.  |
| **Secrets & Patient Data Hygiene** | 🟢 PASS        | Zero credentials, secrets, or real patient data leaked in tracked files or commit history.             |
| **Supabase Integration Status**    | 🟡 CONDITIONAL | **Planned only**. No SDKs installed, no live project connected, no tables or migrations exist.         |
| **Auth, RBAC & RLS Status**        | 🟡 CONDITIONAL | **Conceptual only**. Code files are empty stubs (`export {}`). Must not be represented as implemented. |
| **Database Design Integrity**      | 🟡 CONDITIONAL | 28 tables defined; missing partial unique indexes on soft deletes, ambiguous FK on `claim_items`.      |
| **Phase Definition Alignment**     | 🔴 ATTENTION   | Roadmap Phase 2 scope was committed in Phase 1 commit `71db268`, causing phase numbering drift.        |
| **Git / Automation Workflow**      | 🟡 CONDITIONAL | Claim that changes "auto-commit and auto-push" is false. Actual workflow is manual and governed.       |

---

## 2. Verified Facts versus Assumptions

To maintain engineering discipline, current project attributes have been audited and separated into verified facts and working assumptions.

### 2.1 Verified Facts

1. **Next.js & React Baseline:** The application is built on Next.js `16.4.0` (App Router, Turbopack enabled) and React `19.3.0` with TypeScript `^5` in strict mode (`tsconfig.json`).
2. **Quality Tooling Installed:** ESLint `9` with `eslint-config-next`, Prettier `3.9.10`, Husky `9.1.7`, `lint-staged` `16.4.0`, Vitest `5.0.4`, and `@playwright/test` `1.64.0` are active.
3. **Dual Documentation Directory Existence:** Documentation exists in two locations: `t:\DHQ KOhat Project\docs\` (untracked by Git) and `t:\DHQ KOhat Project\medledger\docs\` (tracked in Git commit `71db268`).
4. **Empty Module Skeletons:** All 11 feature modules (`patients`, `prescriptions`, `dispensing`, `medicines`, `inventory`, `suppliers`, `purchasing`, `claims`, `finance`, `reports`, `notifications`) and 5 core infrastructure modules (`auth`, `authorization`, `audit`, `config`, `database`) contain only docstrings and `export {};`.
5. **No Database Migrations or CLI:** No `supabase/` directory exists, no SQL migrations exist, and neither `@supabase/supabase-js` nor `@supabase/ssr` is installed in `package.json`.
6. **Git Clean State:** Commit `71db268` is synced with `origin/main` on remote `https://github.com/00tatheer00/MedLedger---Pharmacy-Management-System-Sehat-Card-.git`.

### 2.2 Assumptions Requiring Validation (Currently Open in `OPEN_QUESTIONS.md`)

1. **Hospital Claim Rates (OQ-001 - Critical):** Assumed to be configurable per-medicine rates. No rate formula (fixed rate, markup percentage, or slab rate) has been confirmed by DHQ Hospital Kohat.
2. **Claim Approval Workflow (OQ-002 - Critical):** Assumed to be a single-stage approval by finance staff. Multi-level administrative sign-offs (e.g., Medical Superintendent, Sehat Card Desk) remain unverified.
3. **Role Definitions & Matrix (OQ-003 - Critical):** Assumed to be 5 fixed roles (`system_admin`, `pharmacy_manager`, `pharmacist`, `purchasing_staff`, `finance_staff`) with single-role assignment and no dual-authorization requirements.
4. **Internet Connectivity & Offline Operation (OQ-004 - Critical):** Assumed to be reliable enough for a pure cloud application. No offline database synchronization is planned.
5. **Prescription Ingestion Mode (OQ-012 - Medium):** Assumed to be post-dispensing digital transcription of physical paper prescriptions; doctor digital signature or direct entry is out of scope.
6. **Patient Identifier Scheme (OQ-011 - Medium):** Assumed that pharmacy auto-generates Medical Record Numbers (MRN) when hospital-issued MR numbers are unavailable for walk-in patients.

---

## 3. Documentation Inconsistencies Identified & Handled

A forensic cross-document comparison revealed the following inconsistencies across the planning files:

### 3.1 Dual Documentation Hierarchy

- **Issue:** Documentation was created at the workspace root (`t:\DHQ KOhat Project\docs`) and duplicated inside `medledger/docs`. Prettier formatting was only run on `medledger/docs`, causing text divergence between the root and project directories.
- **Resolution:** Both documentation sets have been synchronized and formatted with Prettier. Architectural references are standardized.

### 3.2 Roadmap Phase Drift

- **Issue:** In `DEVELOPMENT_ROADMAP.md`, Phase 1 was defined strictly as "Architecture & Planning" with the acceptance criterion: _"No application code or database migrations created"_. Phase 2 was defined as _"Project Initialization & Engineering Setup"_. However, commit `71db268` implemented the entire Next.js project, tooling, test framework, and skeleton, and `src/app/page.tsx` announced _"Phase 1 Complete, Ready for Phase 2: Design System & Core Primitives"_.
- **Resolution:** An Engineering Status Note was added to `DEVELOPMENT_ROADMAP.md` clarifying that Phase 2 engineering initialization was pulled forward into commit `71db268`. Phase 2 is now formally defined as the **Design System & Core UI Primitives** milestone.

### 3.3 Environment Variable & Secret Naming Mismatch

- **Issue:** `SECURITY_PLAN.md` Section 6.1 listed `NEXTAUTH_SECRET (or equivalent)` and unprefixed `SUPABASE_URL` and `SUPABASE_ANON_KEY`. However, ADR-003 explicitly rejected NextAuth in favor of Supabase Auth, and `.env.example` defines `AUTH_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Resolution:** `SECURITY_PLAN.md` was corrected to reference `AUTH_SECRET` and properly distinguish client-safe `NEXT_PUBLIC_*` variables from server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`).

### 3.4 Tailwind CSS v4 Configuration Mismatch

- **Issue:** ADR-008 stated that design tokens would be configured in `tailwind.config.ts`. However, the repository uses Tailwind CSS v4 (`@tailwindcss/turbopack: ^4`), which deprecates `tailwind.config.ts` in favor of CSS `@theme` directives in `src/app/globals.css`.
- **Resolution:** ADR-008 was updated to reflect Tailwind CSS v4 CSS-first `@theme` configuration.

### 3.5 Schema Table Count Discrepancy

- **Issue:** The project review task refers to a "22-table schema", whereas `DATABASE_DESIGN.md` Section 3 outlines 28 relational tables (5 Auth/RBAC, 2 Patient, 2 Prescription, 2 Dispensing, 3 Medicine/Inventory, 5 Supplier/Purchasing, 2 Payables, 4 Claims, 2 Audit/Notifications, 1 Config).
- **Resolution:** Clarified in `DATABASE_DESIGN.md` that the preliminary schema encompasses 28 tables in total (20 core clinical/financial domain tables, 5 RBAC tables, and 3 cross-cutting audit/system tables).

---

## 4. Security and Data-Integrity Risks

A review of the 28-table preliminary database design and security plan identified several data-integrity risks that must be corrected before Phase 4 (Database & Auth):

### 4.1 Data-Integrity Risks in Schema Design

1. **Soft Delete Unique Constraint Trap:**
   - _Problem:_ `DATABASE_DESIGN.md` mandates soft deletes (`deleted_at`), but defines unique constraints on fields like `patients.mr_number`, `admissions.admission_number`, `suppliers.ntn_number`, and `purchase_orders.po_number`. Standard PostgreSQL unique constraints will treat soft-deleted rows as duplicates, preventing re-registration or correction.
   - _Remedy:_ Added Principle 9 to `DATABASE_DESIGN.md` requiring partial unique indexes (`CREATE UNIQUE INDEX ON patients (mr_number) WHERE deleted_at IS NULL`).
2. **Ambiguous Claim-to-Dispensing Relationship:**
   - _Problem:_ `claim_items` had `dispensing_record_id (FK)` and `medicine_id (FK)`, but not `dispensing_item_id (FK)`. Because dispensing records frequently contain multiple medicine items and batches, linking only to the record header prevents granular, batch-level claim reconciliation and itemized approval/rejection.
   - _Remedy:_ Updated `claim_items` to include `dispensing_item_id (FK)` as the primary fulfillment key.
3. **Inability to Trace Medicine Substitution:**
   - _Problem:_ `dispensing_items` links to `prescription_item_id` and `medicine_batch_id`. If a pharmacist substitutes a brand or generic alternative (as allowed in OQ-006), the batch belongs to a medicine different from `prescription_items.medicine_id`. Without an explicit `dispensed_medicine_id` on `dispensing_items`, auditing substitutions requires a multi-table join and lacks historical immutability if catalogue definitions change.
4. **Rigid Payment-to-Invoice Relationships:**
   - _Problem:_ `supplier_payments` contains `supplier_invoice_id (FK)` and `claim_payments` contains `claim_id (FK)`. In hospital accounting, a single bank transfer or cheque often settles multiple invoices or claims simultaneously, or a single invoice is settled across multiple partial disbursements. A strict 1:N foreign key fails under multi-invoice payment vouchers. A payment allocation junction table is needed.
5. **Inconsistent Soft Delete Coverage:**
   - _Problem:_ While Principle 4 dictates that business records are never physically deleted, `prescriptions`, `admissions`, `purchase_orders`, `supplier_invoices`, and `claims` lacked `deleted_at` timestamps in their entity definitions, relying solely on status enums.
6. **Impossible Foreign Key DDL Clause:**
   - _Problem:_ Section 4.4 described `Claim → Claim Items` as `CASCADE (draft claims only; submitted claims use soft delete)`. PostgreSQL foreign keys cannot be conditional at the DDL level.
   - _Remedy:_ Standardized to DDL `RESTRICT`, delegating draft cascade deletion to transactional application logic or stored procedures.

### 4.2 Concurrency & Transaction Boundary Risks

- **Dispensing Atomicity:** A single dispensing operation affects 7 distinct tables (`dispensing_records`, `dispensing_items`, `prescription_items`, `prescriptions`, `medicine_batches`, `stock_movements`, `audit_events`).
- **Race Hazard:** Two pharmacists dispensing the last stock of an antibiotic at separate counters could cause negative inventory or phantom stock unless batches are locked using `SELECT FOR UPDATE`.
- **Unresolved ADR-007:** ADR-007 (PostgreSQL Stored Procedures via RPC) remains marked as **"Proposed"**. The decision between PostgreSQL RPC functions and TypeScript-level ORM transactions (Drizzle/pg) must be formalized before database implementation.

### 4.3 Secrets, Credentials, and Patient Data Audit

- **Tracked File Inspection:** Tracked files were searched using `git grep -i -E "(password|secret|key|token|bearer|cnic|mrn)"`. No API keys, passwords, bearer tokens, or personal identifiers are committed.
- **Environment Files:** Only `.env.example` is committed. All sensitive values are blank placeholders. `.gitignore` properly excludes `.env`, `.env.local`, and `.env.*.local`.
- **Git History:** The Git commit history (`169118c` and `71db268`) was inspected with `git log -p`. No secrets or dummy records with real patient identities were ever committed.

---

## 5. Supabase, Authentication, Authorization, and RLS Status

To prevent misrepresenting the project state, the operational status of backend services is certified below:

| Component                | Status             | Reality on Disk                                                                                                  |
| ------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Supabase Client SDK**  | ❌ Not Installed   | `@supabase/supabase-js` and `@supabase/ssr` are missing from `package.json`.                                     |
| **Supabase Project**     | ❌ Not Connected   | No Supabase URL or keys configured; no `.env.local` exists; no `supabase/config.toml` exists.                    |
| **Database Migrations**  | ❌ None            | 0 SQL migration files exist on disk.                                                                             |
| **Authentication Flow**  | ❌ Skeleton Stub   | `src/core/auth/index.ts` contains only `export {};` with planning comments.                                      |
| **Authorization / RBAC** | ❌ Skeleton Stub   | `src/core/authorization/index.ts` contains only `export {};`. No permission functions exist.                     |
| **Row Level Security**   | ❌ Conceptual Only | RLS policies exist exclusively as SQL snippets in `SECURITY_PLAN.md`. No database engine exists to enforce them. |
| **Audit Logging**        | ❌ Skeleton Stub   | `src/core/audit/index.ts` contains only `export {};`.                                                            |
| **Database Helpers**     | ❌ Skeleton Stub   | `src/core/database/index.ts` contains only `export {};`.                                                         |

**Verdict:** Backend integration is **Planned Only**. Do not report backend, authentication, or database capabilities as functional.

---

## 6. Test Results and Coverage Limitations

All automated verification commands were executed directly in the project environment.

### 6.1 Execution Results

| Check                    | Command                 | Result    | Duration | Details                                                 |
| ------------------------ | ----------------------- | --------- | -------- | ------------------------------------------------------- |
| **TypeScript Typecheck** | `npm run typecheck`     | ✅ PASSED | 3.4s     | 0 type errors; strict mode compliant.                   |
| **ESLint**               | `npm run lint`          | ✅ PASSED | 5.8s     | 0 warnings, 0 errors.                                   |
| **Prettier Formatting**  | `npm run format:check`  | ✅ PASSED | 1.8s     | All files match style guide.                            |
| **Unit Test Suite**      | `npm run test`          | ✅ PASSED | 1.96s    | 2 test files, 7 tests passed.                           |
| **Test Coverage**        | `npm run test:coverage` | ✅ PASSED | 2.67s    | 100% on tested units (`v8` provider).                   |
| **Production Build**     | `npm run build`         | ✅ PASSED | 5.2s     | Static prerendering of `/` and `/_not-found` succeeded. |
| **End-to-End Suite**     | `npm run test:e2e`      | ✅ PASSED | 7.5s     | 1 Chromium Playwright test passed.                      |

### 6.2 What Existing Tests Cover

- `src/lib/utils.test.ts` (4 tests):
  - Merging standard Tailwind classes via `clsx` and `tailwind-merge`.
  - Conditional class evaluation.
  - Conflict resolution (e.g., `p-4` vs `p-2`).
  - Graceful handling of `null`, `undefined`, and empty strings.
- `src/core/errors/errors.test.ts` (3 tests):
  - Creation and typing of `successResult(data)`.
  - Creation of generic `errorResult(code, message)`.
  - Creation of structured `VALIDATION_ERROR` results containing field-level error mappings.
- `e2e/app.spec.ts` (1 test):
  - Navigates to `http://localhost:3000/` and verifies browser title matches `/MedLedger/`.

### 6.3 What Remains Completely Untested

- **Authentication & Session Management:** Zero tests (no session cookie verification, token refresh, or login/logout).
- **Authorization & RBAC:** Zero tests (no permission checks, role grants, or 403 response testing).
- **Database Queries & Mutations:** Zero tests (no queries written, no Supabase mocks, no test container).
- **Transaction Concurrency & Stock Locks:** Zero tests (no concurrent dispensing simulation).
- **Data Validation:** Zero schema tests (no Zod validation schemas implemented).
- **Domain Modules:** Zero tests across all 11 feature modules (patients, dispensing, claims, etc.).

---

## 7. Git Status and Remote Workflow Verification

### 7.1 Current Repository Status

- **Git Root:** `t:\DHQ KOhat Project\medledger`
- **Active Branch:** `main` (tracking `origin/main`)
- **Latest Commit:** `71db268` (_feat: initialize MedLedger architecture, domain skeleton, testing suite, and CI/CD_)
- **Author:** `00tatheer00 <tatheerabidi00@gmail.com>` (Tue Oct 13 04:03:38 2026 +0500)
- **Remote URL:** `https://github.com/00tatheer00/MedLedger---Pharmacy-Management-System-Sehat-Card-.git`
- **Working Tree:** Clean upstream status; local modifications limited to documentation corrections made during this review. No commits or pushes have been made without approval.

### 7.2 Verification of Auto-Commit and Auto-Push Statement

- **Claim:** _"Future changes will automatically be committed and pushed."_
- **Engineering Reality:** **THIS STATEMENT IS INACCURATE.**
- **Explanation:**
  1. Git has no built-in mechanism to automatically stage, commit, and push modifications upon file changes.
  2. The local Husky hook (`.husky/pre-commit`) is configured to run `npx lint-staged` on staged files. It intercepts an explicit `git commit` to enforce formatting and linting; it does **not** create commits automatically.
  3. The GitHub Actions CI pipeline (`.github/workflows/ci.yml`) triggers on `push` or `pull_request` to run verification checks. It does not push code back to the repository.
  4. In this agent environment, commits and pushes require explicit command execution. Furthermore, pushing to the remote requires explicit user authorization.

---

## 8. Summary of Foundation Fixes Applied in This Review

The following non-disruptive, safe documentation fixes were executed during this review:

1. **`medledger/docs/SECURITY_PLAN.md`:**
   - Corrected secret categories table to match `.env.example`: renamed `NEXTAUTH_SECRET` to `AUTH_SECRET`.
   - Added `NEXT_PUBLIC_` prefixes to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to reflect Next.js client exposure standards.
2. **`medledger/docs/ARCHITECTURE_DECISIONS.md`:**
   - Updated ADR-008 to reflect Tailwind CSS v4 CSS `@theme` tokens in `src/app/globals.css` rather than the deprecated `tailwind.config.ts`.
3. **`medledger/docs/DATABASE_DESIGN.md`:**
   - Added Principle 9 mandating partial unique indexes (`WHERE deleted_at IS NULL`) for soft-deleted tables.
   - Updated `claim_items` to include `dispensing_item_id (FK)` alongside `dispensing_record_id (FK)`.
   - Corrected `Claim → Claim Items` foreign key constraint description from conditional `CASCADE` to DDL `RESTRICT`.
4. **`medledger/docs/DEVELOPMENT_ROADMAP.md`:**
   - Added an Engineering Status Note clarifying that Next.js project setup and CI/CD tooling originally slated for Phase 2 were completed in commit `71db268`.
5. **Workspace Documentation Sync:**
   - Synchronized and formatted all files between `t:\DHQ KOhat Project\docs\` and `t:\DHQ KOhat Project\medledger\docs\` so neither directory contains outdated information.

---

## 9. Prioritized Pre-Phase 2 Checklist and Acceptance Criteria

Before commencing Phase 2 (Design System & Dashboard UI), the following checklist must be satisfied:

```markdown
- [x] Quality pipeline passes (Typecheck, Lint, Prettier, Unit Tests, E2E, Build).
- [x] Zero hardcoded secrets, credentials, or production patient data in tracked files.
- [x] Documentation synchronized and clear of conflicting framework references.
- [ ] PRIORITY 0: User approval of this Phase 1 Independent Engineering Review verdict.
- [ ] PRIORITY 1: Formal decision on ADR-007 (PostgreSQL Stored Procedures vs. TypeScript ORM for atomic transactions).
- [ ] PRIORITY 1: Clarification of multi-invoice payment allocation in schema design before Phase 4.
- [ ] PRIORITY 2: Confirmation of DHQ Hospital Kohat claim rate formula (OQ-001) before claims UI is drafted.
- [ ] PRIORITY 2: Staging/commit of the documentation corrections made during this review upon user approval.
```

### Acceptance Criteria for Phase 2 Entry

1. **Approval:** The user explicitly approves this review verdict (**PASS WITH CONDITIONS**) and the documentation adjustments.
2. **Design System Scope:** Phase 2 is strictly scoped to building UI components (Tailwind CSS tokens, layout shell, sidebar, navigation, tables, and form controls) without database mutations or mock backend calls.
3. **No Unconfirmed Business Logic:** No specific hospital claim percentage or approval hierarchy will be hardcoded in UI mockups.

---

> **Report Prepared by:** Principal Software Engineer  
> **Status:** Awaiting User Sign-Off to Commit Review Artifacts and Open Phase 2.
