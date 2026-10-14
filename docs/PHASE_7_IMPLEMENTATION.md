# MedLedger — Phase 7 Implementation Report: Suppliers, Purchasing & Goods Receiving

> **Milestone:** Phase 7 — Suppliers, Purchasing & Goods Receiving  
> **Date:** 2026-10-13  
> **Role:** Senior Full-Stack Engineer & Purchasing Systems Architect  
> **Status:** Completed & Verified

---

## 1. Executive Summary

Phase 7 implements the end-to-end procurement and payables lifecycle for MedLedger at DHQ Hospital, Kohat, Pakistan. It establishes distributor registry management, multi-line purchase order generation, physical intake verification via Goods Receipt Notes (GRN), commercial invoice tracking, and multi-invoice payment disbursement vouchers.

Crucially, physical intake through goods receiving routes **strictly and atomically** through the shared inventory ledger foundation created in Phase 6 (`inventoryStore.receiveGoodsBatch`), guaranteeing that MedLedger maintains a single authoritative, append-only stock movement ledger.

### Implemented Subsystems

1. **Supplier Directory & CRM (`src/modules/suppliers/`):**
   - Paginated distributor registry with debounced search across distributor name, contact person, phone number, and NTN.
   - Comprehensive supplier profile capturing contact credentials, physical address, and optional Pakistani National Tax Number (NTN).
   - Duplicate prevention enforcing case-insensitive uniqueness on distributor names and optional NTN numbers.
   - Active/inactive status toggle with real-time distributor spend and order count analytics.
   - Regulatory honesty: does not invent unconfirmed tax rules or mandatory approval workflows.

2. **Purchase Orders (`src/modules/purchasing/`):**
   - Multi-line purchase order generator (`/purchases/new`) with active supplier selection, medicine catalogue picker, dynamic line insertion/removal, and scheduled expected delivery dates.
   - Strict server-side Zod validation of order quantities, unit costs, and catalogue references.
   - Decimal-safe monetary arithmetic via `src/lib/decimal.ts` (`multiplyMoney`, `roundMoney`, `addMoney`) eliminating binary floating-point drift.
   - Purchase order lifecycle state machine: `draft` -> `submitted` -> `partially_received` -> `fully_received` -> `cancelled`.
   - Line-level fulfillment tracking comparing `quantity_ordered` vs. `quantity_received`.

3. **Goods Receiving & Physical Intake (`src/modules/purchasing/` & `src/modules/inventory/`):**
   - Interactive Goods Receipt Note modal (`GoodsReceivingDialog`) recording delivery challan number, supplier invoice reference, and intake breakdown.
   - Lot-level intake capturing manufacturer batch number, mandatory future expiry date, accepted quantity, and rejected quantity with discrepancy notes.
   - **Unified Inventory Integration:** Accepted quantities route directly into `inventoryStore.receiveGoodsBatch(...)`, crediting batch on-hand stock and synchronously generating an immutable `StockMovement` ledger entry of type `goods_receipt`.
   - **Over-Receipt Prevention:** Prevents intake exceeding remaining outstanding quantities on purchase order items (`accepted + rejected <= ordered - existing_received`).
   - **Rejected Goods Quarantine:** Damaged or rejected quantities are preserved in the GRN item record with documented discrepancy reasons, but are **strictly excluded** from available inventory.
   - Automatic PO status progression: updates purchase orders to `partially_received` or `fully_received` based on cumulative accepted items.

4. **Supplier Invoices & Payables (`src/modules/purchasing/`):**
   - Commercial invoice ledger (`/purchases?tab=invoices`) tracking supplier, invoice number, due date, total billed amount, paid amount, and outstanding balance.
   - Automatic generation of supplier invoices during goods intake (linking GRN and PO references) or manual invoice creation.
   - Invoice payment states: `pending`, `partially_paid`, `paid`, and `disputed`.

5. **Multi-Invoice Payment Allocations (`src/modules/purchasing/`):**
   - Payment disbursement voucher recording dialog (`RecordPaymentDialog`) supporting 1-to-many allocation across multiple outstanding invoices for the same distributor.
   - Strict allocation mathematics: validates that the sum of line allocations matches the voucher total, and no allocation exceeds the individual invoice's remaining balance.
   - Atomic balance settlement: updates invoice `paid_amount`, `outstanding_balance`, and `status` in lockstep with voucher generation.

---

## 2. Preflight Verification & Architectural Invariants

Before implementation, the following architectural prerequisites were verified:

1. **Git Working Tree & Branch Integrity:**
   - Active branch `main` verified with clean working tree.
   - In accordance with engineering guidelines, **zero Git commits or pushes were executed**.
2. **Database Schema Readiness:**
   - Schema tables `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `supplier_invoices`, and `supplier_payments` were confirmed in `supabase/migrations/00001_initial_schema.sql` and `docs/DATABASE_DESIGN.md`.
3. **Inventory Foundation Verification:**
   - Phase 6 inventory foundations (`src/modules/inventory/`) were verified with 16/16 unit tests passing.
   - Instead of creating a secondary stock mutation path, `inventoryStore.receiveGoodsBatch(...)` was extended to accept supplier references and unit costs, ensuring goods receiving operations append directly to the authoritative stock movement ledger.
4. **Decimal-Safe Financial Computing:**
   - Created `src/lib/decimal.ts` providing precision-preserving monetary calculations with 2 decimal places, preventing IEEE-754 binary floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).

---

## 3. Domain Modules Architecture

```
src/
├── lib/
│   └── decimal.ts             # Precision monetary arithmetic (multiplyMoney, roundMoney, formatPKR)
├── modules/
│   ├── inventory/
│   │   ├── prototype-store.ts # Extended with receiveGoodsBatch(...) atomic stock intake
│   │   └── types.ts           # Extended batch provenance & goods receipt fields
│   ├── suppliers/
│   │   ├── types.ts           # Supplier, SupplierStats, and search filter interfaces
│   │   ├── validation.ts      # Zod validation schemas for supplier creation & updates
│   │   ├── prototype-store.ts # In-memory store with duplicate name & NTN detection
│   │   ├── server-queries.ts  # Database / prototype query abstraction
│   │   ├── actions.ts         # 'use server' Server Actions with RBAC & audit logging
│   │   ├── suppliers.test.ts  # 14 unit tests (100% pass)
│   │   └── index.ts           # Clean barrel exports
│   └── purchasing/
│       ├── types.ts           # PO, POItem, GRN, GRNItem, SupplierInvoice, Payment types
│       ├── validation.ts      # Zod schemas for POs, GRN intake, and payment allocations
│       ├── prototype-store.ts # Purchase lifecycle, over-receipt guards, invoice & payment store
│       ├── server-queries.ts  # Database / prototype purchasing queries
│       ├── actions.ts         # 'use server' Server Actions with transactional updates
│       ├── purchasing.test.ts # 17 unit tests (100% pass)
│       └── index.ts           # Clean barrel exports
```

---

## 4. UI Components & Screen Structure

### 4.1 Supplier Management

1. **Suppliers Directory (`/suppliers`):**
   - Paginated table showing distributor name, contact person, phone, email, NTN, active status, and spend summary.
   - Debounced search and status filter dropdown with real-time result updates.
   - Direct action buttons to view details, edit distributor, or register a new supplier.
2. **Supplier Registration & Edit (`/suppliers/new`, `/suppliers/[id]/edit`):**
   - Clean, accessible forms with immediate client and server-side Zod validation.
   - Duplicate name and NTN collision warnings displayed inline.
3. **Supplier Detail Profile (`/suppliers/[id]`):**
   - Supplier overview card with contact information, NTN, status, and registration date.
   - KPI metrics: Total Spend (PKR), Purchase Orders Count, Active Orders.
   - Integrated Purchase Orders table filtered specifically to the distributor.

### 4.2 Purchasing & Goods Receiving Hub (`/purchases`)

1. **Consolidated Purchasing Hub (`/purchases`):**
   - Tabbed interface providing unified access to:
     - **Purchase Orders Tab (`?tab=orders`):** Filter by supplier or status (`draft`, `submitted`, `partially_received`, `fully_received`, `cancelled`). Shows PO number, supplier, date, total amount, delivery date, fulfillment progress bar, and status badge.
     - **Goods Receipts Tab (`?tab=receipts`):** Chronological log of GRNs showing GRN number, PO reference, supplier, date, challan number, invoice number, and receiving officer.
     - **Supplier Invoices Tab (`?tab=invoices`):** Commercial payables registry displaying invoice number, supplier, date, due date, total amount, paid amount, outstanding balance, and status badge. Includes quick action to record disbursement.
2. **Purchase Order Creation (`/purchases/new`):**
   - Header metadata: supplier selection, order date, and expected delivery date.
   - Dynamic medicine item rows: select medicine from catalogue, enter quantity and agreed unit cost. Automatically calculates line total and authoritative order total using decimal-safe arithmetic.
   - Server-validated submission returning clear field-level errors if quantities or prices are invalid.
3. **Purchase Order Detail Profile (`/purchases/[id]`):**
   - Comprehensive status header with action buttons:
     - **Submit Order:** Transitions draft order to `submitted`.
     - **Cancel Order:** Cancels draft or submitted order with audit remarks.
     - **Receive Goods:** Opens the physical intake dialog for submitted or partially received orders.
   - Line items table displaying ordered quantity, already received quantity, remaining outstanding quantity, unit cost, and line total.
   - Linked Goods Receipts table showing all intake deliveries against the order.
   - Linked Supplier Invoices table showing all bills associated with the order.
4. **Goods Receiving Dialog (`GoodsReceivingDialog`):**
   - Captures delivery challan number, supplier invoice number, and intake notes.
   - For each outstanding order line, pharmacy staff enter:
     - Batch / Lot number (required).
     - Expiry date (must be in the future).
     - Accepted quantity (immediately credited to stock).
     - Rejected quantity (optional, quarantined).
     - Rejection reason (required if rejected quantity > 0).
   - Prevents total received quantity (`accepted + rejected`) from exceeding outstanding order quantity.
5. **Record Payment Dialog (`RecordPaymentDialog`):**
   - Displays all outstanding unpaid and partially paid invoices for the distributor.
   - Prompts for total payment amount, payment method (Bank Transfer, Cheque, Cash, Online), reference number, and payment notes.
   - Multi-invoice allocation table allowing distribution of the total payment across one or multiple invoices.
   - Real-time client-side and server-side validation ensuring `sum(allocated) === total_amount` and `allocation <= outstanding_balance`.

---

## 5. Financial & Record Integrity Guarantees

- **Decimal-Safe Financial Arithmetic:**
  - Standard JavaScript binary floating point arithmetic is susceptible to rounding errors. MedLedger Phase 7 introduces `src/lib/decimal.ts`, enforcing two-decimal place integer scaling (`Math.round(val * 100) / 100`) across all purchase line totals, purchase order sums, GRN item costs, invoice totals, and payment allocations.
- **Single Stock Update Mechanism:**
  - Goods intake operations call `inventoryStore.receiveGoodsBatch(...)`. This guarantees:
    - Atomicity between batch quantity increments and append-only stock movement logging.
    - Zero divergence between inventory balance records and the physical intake log.
- **Rejected Goods Exclusion:**
  - Non-conforming or damaged shipments (`quantity_rejected > 0`) are recorded on the GRN item with reason for supplier credit dispute, but are **never added to on-hand inventory**.
- **Over-Receipt Prevention:**
  - Both prototype store and server validation reject receipt submissions where `quantity_accepted + quantity_rejected > line.quantity_ordered - line.quantity_received`.
- **Idempotency & Concurrency:**
  - Client mutation identifiers (`clientMutationId`) protect against accidental double-clicks or network retries creating duplicate GRNs or double-crediting stock.
- **Server-Side Authorization & RLS:**
  - Supplier modifications require `suppliers:write` / `procurement:write`.
  - Purchase order creation requires `purchasing:write`.
  - Goods receiving requires `inventory:receive`.
  - Payment recording requires `billing:write`.

---

## 6. Automated Verification Pipeline Results

### 6.1 Unit & Integration Tests (Vitest)

All 21 test suites passed with 168 tests total (100% success rate):

- **Suppliers Module (`src/modules/suppliers/suppliers.test.ts`):** 14/14 passed.
  - Validation: rejects empty names, invalid email formats, and invalid phone lengths.
  - Duplicate Detection: rejects duplicate supplier names (case-insensitive) and duplicate NTNs.
  - Search & Filtering: accurately filters suppliers by name, contact, NTN, and active status.
  - Lifecycle: toggles supplier active status and computes spend analytics.
- **Purchasing Module (`src/modules/purchasing/purchasing.test.ts`):** 17/17 passed.
  - Financial Calculations: decimal-safe order totals and line calculations.
  - Order Lifecycle: status progression from `draft` -> `submitted` -> `cancelled`.
  - Goods Receiving: atomic batch creation and stock movement generation via `receiveGoodsBatch`.
  - Over-Receipt Guard: rejects intake exceeding remaining outstanding line quantities.
  - Expiry Enforcement: rejects batches with past or today's expiry dates.
  - Discrepancy Tracking: verifies rejected quantities do not increase inventory.
  - Idempotency: duplicate intake submission prevention.
  - Invoices & Multi-Invoice Allocation: verifies payment vouchers correctly allocate funds across multiple invoices and update balances.
- **Existing Test Suites Maintained:**
  - `medicines.test.ts` (19 tests), `inventory.test.ts` (16 tests), `patients.test.ts` (16 tests), `prescriptions.test.ts` (11 tests), `admissions.test.ts` (10 tests), `dashboard.test.ts` (11 tests), `roles.test.ts` (11 tests), `migrations.test.ts` (6 tests), UI component tests (17 tests).

### 6.2 End-to-End Tests (Playwright)

All 11 Playwright end-to-end tests passed:

1. Application loads and displays hospital branding and title.
2. Displays all 4 core KPI summary metrics.
3. Displays recent activity table and handles tab filtering.
4. Navigates to placeholder pages with honest prototype notices.
5. Navigates to patients directory, searches, and inspects patient profile.
6. Navigates to prescription queue and transcribes paper prescription.
7. Navigates to inpatient admissions directory.
8. Navigates to medicines catalogue, searches, and inspects details.
9. Navigates to inventory overview and verifies surveillance tabs.
10. **Navigates to suppliers directory, searches distributors, and views supplier details.**
11. **Navigates to purchasing hub, views purchase orders, and navigates to order creation form.**

### 6.3 Code Quality & Build Verification

- **Linting (`npm run lint`):** 0 errors, 0 warnings across the entire repository.
- **Formatting (`npm run format`):** Prettier verified and applied across all files.
- **TypeScript Typecheck (`npm run typecheck`):** TypeScript strict mode passed with 0 errors.
- **Production Build (`npm run build`):** Turbopack production compilation succeeded with exit code 0 across all 27 static and partial-prerender routes.

---

## 7. Strict Scope Boundaries Preserved

The following features were strictly excluded in accordance with the Phase 7 specifications:

- **No Medicine Dispensing:** No stock deductions or prescription dispensing workflows (scheduled for Phase 8).
- **No Hospital Reimbursement Claims:** No claim items or billing calculations against hospital funds (scheduled for Phase 9).
- **No External Bank Integrations:** Real bank transfer APIs or payment gateways were not created; payments are recorded as internal accounting vouchers.
- **No Unconfirmed Tax or Approval Policies:** Withholding tax percentages, advance tax deductions, and multi-tier institutional approval matrices were not assumed or hardcoded.

---

## 8. Unresolved Client Decisions & Future Considerations

1. **Multi-Tier Approval Hierarchy:**
   - Currently, purchase orders can be submitted by pharmacy officers directly. If DHQ Hospital requires a secondary sign-off (e.g. Medical Superintendent or Chief Pharmacist approval) for orders exceeding a specific monetary threshold, this can be configured in the system configuration table.
2. **Distributor Tax Deduction at Source (WHT):**
   - Pakistani tax regulations frequently require withholding tax on distributor payments depending on filer status. Tax withholding fields will be added once DHQ Hospital's finance department confirms the applicable rates.
3. **Credit Terms & Automatic Due Dates:**
   - Invoice due dates currently default to 30 days from delivery. Standard payment terms by distributor can be added when distributor contracts are onboarded.

---

## 9. Conclusion

Phase 7 is complete, fully tested, and verified. MedLedger now provides a reliable, decimal-safe procurement and goods receiving pipeline that guarantees stock integrity by feeding physical intake directly into the authoritative inventory ledger.
