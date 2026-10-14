# MedLedger — Phase 6 Implementation Report: Medicine Catalogue & Inventory Management

> **Milestone:** Phase 6 — Medicine Catalogue & Inventory Management  
> **Date:** 2026-10-13  
> **Role:** Senior Full-Stack Engineer & Inventory Systems Architect  
> **Status:** Completed & Verified

---

## 1. Executive Summary

Phase 6 implements the core medicine master catalogue and transactional inventory ledger architecture for MedLedger at DHQ Hospital, Kohat, Pakistan. It establishes batch-level stock surveillance, first-expiring-first-out (FEFO) visibility, configurable threshold monitoring, and an append-only stock movement ledger.

### Implemented Subsystems

1. **Medicine Catalogue (`src/modules/medicines/`):**
   - Server-side paginated master directory with debounced multi-field search across brand name, generic name, dosage strength, therapeutic category, and catalogue codes.
   - Robust medicine registration and editing with strict Zod validation.
   - Duplicate prevention enforcing unique `(name, strength)` combinations.
   - Comprehensive metadata: generic name, brand name, dosage form (tablets, capsules, syrups, suspensions, injections, IV infusions, topical, drops, inhalers, suppository), strength, therapeutic category, manufacturer, unit of measure, package size, dispensing unit, shelf location, and active/inactive status toggle.
   - Strict adherence to regulatory honesty: does not invent unverified DRAP registration numbers or mandate speculative regulatory tags.

2. **Batch Management (`src/modules/inventory/`):**
   - Distinct batch-level inventory records with medicine reference, batch/lot number, expiry date, quantity on hand, unit cost, pack purchase price, receipt reference, and batch status (`active`, `quarantined`, `expired`, `depleted`).
   - Strict database & application uniqueness constraint preventing duplicate `(medicine_id, batch_number)`.
   - Never silently merges batches with differing expiry dates, costs, or origins.
   - Opening balance intake dialog requiring initial lot number, unit cost, expiry date, and recorded transaction note.

3. **Stock Movement Ledger (`src/modules/inventory/`):**
   - Append-only, auditable ledger tracking all stock variations: `opening_balance`, `goods_receipt`, `dispensing`, `adjustment_increase`, `adjustment_decrease`, `quarantine`, `write_off`, and `return`.
   - Preserves complete traceability: actor ID, user name, timestamp, reason, reference document, and batch balance before/after.
   - Prohibits arbitrary direct modifications to stock quantities without an authorized, recorded transaction.
   - Enforces the non-negative stock constraint: adjustments cannot reduce stock below zero.
   - Protects against duplicate submissions via client & server-side idempotency tracking (`client_mutation_id`).

4. **Low-Stock & Expiry Surveillance (`src/modules/inventory/alerts.ts`):**
   - Configurable alert rules:
     - **Low Stock:** `available_stock <= min_threshold` (development default: 50 units per medicine).
     - **Out of Stock:** `available_stock === 0`.
     - **Near Expiry:** Active batches expiring within a configurable surveillance window (development default: 90 days).
     - **Expired:** Batches past their expiry date (`expiry_date <= today`).
   - Accessible visual badges and high-contrast indicators without relying solely on color.
   - Expired batches are automatically excluded from available dispensing totals.

5. **Strict Scope Boundaries Preserved:**
   - **No Prescription Dispensing:** Prescription recording does not deduct inventory; dispensing remains in Phase 8/10.
   - **No Goods Receiving / PO Execution:** GRN order lifecycle remains in Phase 7/9; opening stock uses an authorized opening balance ledger entry.
   - **No Unconfirmed Hospital Policies:** Uses clearly documented development defaults for threshold values.

---

## 2. Preflight Findings & Architecture Alignment

Before coding Phase 6, the following architectural elements were verified:

1. **Database Schema Readiness:**
   - Tables `medicines`, `medicine_batches`, and `stock_movements` were defined in `supabase/migrations/00001_initial_schema.sql` with foreign keys, check constraints (`quantity_on_hand >= 0`), and indexes.
2. **Hybrid Store Pattern:**
   - Server Actions query live Supabase PostgreSQL when credentials exist, with high-fidelity fallback to the in-memory store (`prototype-store.ts`) when operating in local development (`isSupabaseConfigured() === false`).
   - All mutation actions enforce server-side RBAC, transaction atomicity, and audit logging.

---

## 3. Domain Modules Architecture

```
src/modules/
├── medicines/
│   ├── types.ts           # Medicine, category, dosage form, and pagination types
│   ├── validation.ts      # Zod schemas for create, update, and search filters
│   ├── prototype-store.ts # In-memory store with (name, strength) collision check
│   ├── server-queries.ts  # Database / prototype query abstraction
│   ├── actions.ts         # 'use server' Server Actions with RBAC & audit logging
│   ├── medicines.test.ts  # 19 unit tests (100% pass)
│   └── index.ts           # Clean barrel exports
└── inventory/
    ├── types.ts           # MedicineBatch, StockMovement, InventoryAlert types
    ├── validation.ts      # Zod schemas for adjustments and opening balance batches
    ├── alerts.ts          # FEFO expiry & low-stock surveillance algorithms
    ├── prototype-store.ts # In-memory batch & immutable stock ledger repository
    ├── server-queries.ts  # Database / prototype inventory queries
    ├── actions.ts         # 'use server' Server Actions with atomic updates & idempotency
    ├── inventory.test.ts  # 16 unit tests (100% pass)
    └── index.ts           # Clean barrel exports
```

---

## 4. UI Components & Screen Structure

1. **Medicines Master Catalogue (`/medicines`):**
   - Paginated table showing brand name, generic name, category, strength, unit of measure, available stock, earliest expiry, and active status.
   - Search bar and category/stock filter dropdowns with URL synchronization.
   - Quick action to register a new medicine.

2. **Medicine Registration & Edit (`/medicines/new`, `/medicines/[id]`):**
   - Multi-section form capturing clinical, regulatory, and inventory thresholds.
   - Inline edit dialog allowing updates to strength, manufacturer, unit of measure, min/max thresholds, and status.

3. **Medicine Detail Profile (`/medicines/[id]`):**
   - High-level KPI summary: Available Stock, Total Stock on Hand, Quarantined/Expired Quantity, Number of Batches.
   - Comprehensive technical specifications card.
   - Active & archived batches table with expiry status and unit cost.
   - Audit trail of stock movements specific to the medicine.

4. **Inventory & Stock Control Hub (`/inventory`):**
   - KPI metrics: Total Stock on Hand, Active Batches, Low Stock Warnings, Expiring Soon.
   - Tabbed interface:
     - **Batches Registry:** Filter by medicine or status, add opening batch, trigger stock adjustments or quarantine.
     - **Stock Movement Ledger:** Complete chronological audit trail of all inventory events with before/after balances.
     - **Surveillance Alerts:** Real-time low stock, out of stock, near expiry, and expired batch alerts.
   - **Stock Adjustment Dialog:** Requires selection of batch, adjustment type (`increase` or `decrease`), quantity, authorized reason (`Damaged in storage`, `Physical count variance`, `Spillage / breakage`, etc.), and remarks. Prevents deductions exceeding available stock.
   - **Add Opening Batch Dialog:** Allows entering verified opening stock with batch number, expiry date, unit cost, and location.

---

## 5. Data Integrity, Concurrency & Security

- **Server-Side Authorization:**
  - Reading catalogue/inventory requires `inventory:read` or `medicines:read`.
  - Creating/updating medicines requires `medicines:write`.
  - Adjusting stock requires `inventory:adjust`.
  - Adding opening batches requires `inventory:receive`.
- **Non-Negative Stock Invariant:**
  - Deductions (`adjustment_decrease`, `quarantine`, `write_off`) check `batch.quantity_on_hand >= quantity`.
  - Database schema enforces `quantity_on_hand >= 0` check constraint.
- **Atomic Balance & Ledger Updates:**
  - Adjustments record a compensatory `StockMovement` row and update `MedicineBatch.quantity_on_hand` together.
  - Failures rollback cleanly without leaving orphaned balance changes.
- **Idempotency Protection:**
  - `client_mutation_id` tracking prevents duplicate form submissions from creating duplicate stock movements.

---

## 6. Automated Test Results

### Unit Test Suite (Vitest)

- **Medicines Module (`src/modules/medicines/medicines.test.ts`):** 19/19 passed.
  - Validation schemas (empty strings, minimum thresholds, negative numbers).
  - Duplicate detection (`(name, strength)` collision).
  - Search across brand name, generic name, and catalogue code.
  - Active/inactive status toggle and pagination.
- **Inventory Module (`src/modules/inventory/inventory.test.ts`):** 16/16 passed.
  - Batch uniqueness constraint `(medicine_id, batch_number)`.
  - Past expiry date rejection on new batches.
  - Atomic stock balance and ledger movement updates.
  - Prevention of negative stock deductions.
  - Duplicate submission / idempotency protection.
  - Batch quarantine status transition.
  - Low-stock and FEFO expiry surveillance calculation.
- **Total Test Suite:** 19 test files, 137 unit tests, 100% passing.

### End-to-End Test Suite (Playwright)

- 9/9 end-to-end tests passing:
  1. Application loads and displays hospital branding and title.
  2. Displays all 4 core KPI summary metrics.
  3. Displays recent activity table and handles tab filtering.
  4. Navigates to placeholder pages with honest prototype notices (`/dispensing`).
  5. Navigates to patients directory, searches, and inspects patient profile.
  6. Navigates to prescription queue and transcribes paper prescription.
  7. Navigates to inpatient admissions directory.
  8. Navigates to medicines catalogue, searches, and inspects details.
  9. Navigates to inventory overview and verifies surveillance tabs.

---

## 7. Open Questions & Remaining Scope

1. **Opening Stock Physical Verification:**
   - The opening stock entry mechanism is implemented. Physical count sign-off procedures must be formalized with DHQ pharmacy management before go-live.
2. **Standard Pack Sizes & Dispensing Conversion:**
   - Tablets are currently tracked in individual units (tablets/capsules). Pack-to-unit conversions for bulk strips/boxes will be coordinated with the Goods Receiving (GRN) module in Phase 7.
3. **Threshold Customization by Department:**
   - Default low-stock threshold is 50 units. Departmental or medicine-specific thresholds will be fine-tuned during user testing.
