# MedLedger — Preliminary Database Design

> **Version:** 0.1.0 (Phase 1 — Planning)
> **Last Updated:** 2026-10-13
> **Status:** Conceptual — No migrations or tables created
> **Purpose:** Identify entities, relationships, constraints, and integrity considerations for the database phase.

---

## 1. Design Principles

1. **Referential integrity is non-negotiable.** Foreign keys are enforced at the database level, not just in application code.
2. **Stock-affecting operations use database transactions.** Application-level checks alone are insufficient.
3. **Audit events are written within the same transaction** as the operation they record.
4. **Soft deletes for business entities.** Patients, prescriptions, and financial records are never physically deleted. A `deleted_at` timestamp marks removal.
5. **Timestamps on all records.** `created_at` and `updated_at` on every table. Audit-relevant tables also track `created_by` and `updated_by`.
6. **UUIDs for primary keys.** Prevents enumeration attacks and simplifies multi-environment data management.
7. **Monetary values stored as integers** (smallest currency unit, e.g., paisa) or `NUMERIC(12,2)`. Never floating point.
8. **Enums defined as PostgreSQL `CHECK` constraints or reference tables**, not application-level string conventions.

---

## 2. High-Level Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : "has"
    ROLES ||--o{ USER_ROLES : "assigned to"
    ROLES ||--o{ ROLE_PERMISSIONS : "grants"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "granted by"

    PATIENTS ||--o{ ADMISSIONS : "admitted"
    ADMISSIONS ||--o{ PRESCRIPTIONS : "receives"
    PATIENTS ||--o{ PRESCRIPTIONS : "prescribed"

    PRESCRIPTIONS ||--o{ PRESCRIPTION_ITEMS : "contains"
    PRESCRIPTION_ITEMS }o--|| MEDICINES : "references"

    PRESCRIPTIONS ||--o{ DISPENSING_RECORDS : "dispensed via"
    DISPENSING_RECORDS ||--o{ DISPENSING_ITEMS : "contains"
    DISPENSING_ITEMS }o--|| PRESCRIPTION_ITEMS : "fulfills"
    DISPENSING_ITEMS }o--|| MEDICINE_BATCHES : "deducted from"

    MEDICINES ||--o{ MEDICINE_BATCHES : "has batches"
    MEDICINE_BATCHES ||--o{ STOCK_MOVEMENTS : "tracked by"

    SUPPLIERS ||--o{ PURCHASE_ORDERS : "receives"
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : "contains"
    PURCHASE_ORDER_ITEMS }o--|| MEDICINES : "for"

    PURCHASE_ORDERS ||--o{ GOODS_RECEIPTS : "fulfilled by"
    GOODS_RECEIPTS ||--o{ GOODS_RECEIPT_ITEMS : "contains"
    GOODS_RECEIPT_ITEMS }o--|| MEDICINE_BATCHES : "creates/updates"

    SUPPLIERS ||--o{ SUPPLIER_INVOICES : "bills"
    SUPPLIER_INVOICES }o--o{ GOODS_RECEIPTS : "covers"
    SUPPLIER_INVOICES ||--o{ SUPPLIER_PAYMENTS : "paid by"

    DISPENSING_RECORDS ||--o{ CLAIM_ITEMS : "claimed in"
    CLAIMS ||--o{ CLAIM_ITEMS : "contains"
    CLAIMS ||--o{ CLAIM_APPROVALS : "approved by"
    CLAIMS ||--o{ CLAIM_PAYMENTS : "paid via"

    USERS ||--o{ AUDIT_EVENTS : "performed"
    USERS ||--o{ NOTIFICATIONS : "receives"
```

---

## 3. Entity Descriptions

### 3.1 Identity & Access

| Entity               | Purpose                                                 | Key Fields                                                                                |
| -------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **users**            | System users (staff accounts). Linked to Supabase Auth. | `id` (UUID, matches auth.users), `full_name`, `email`, `phone`, `is_active`, `created_at` |
| **roles**            | Named roles (e.g., pharmacist, pharmacy_manager).       | `id`, `name` (unique), `description`                                                      |
| **user_roles**       | Many-to-many assignment of roles to users.              | `user_id`, `role_id`, `assigned_at`, `assigned_by`                                        |
| **permissions**      | Granular permissions (e.g., `dispensing:create`).       | `id`, `code` (unique), `description`, `module`                                            |
| **role_permissions** | Many-to-many assignment of permissions to roles.        | `role_id`, `permission_id`                                                                |

### 3.2 Patients & Admissions

| Entity         | Purpose                                                                       | Key Fields                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **patients**   | Patient demographic information.                                              | `id`, `mr_number` (unique, Medical Record Number), `full_name`, `father_name`, `cnic`, `date_of_birth`, `gender`, `phone`, `address`, `created_at`, `deleted_at`                 |
| **admissions** | Hospital admission records. A patient may have multiple admissions over time. | `id`, `patient_id` (FK), `admission_number` (unique), `admission_date`, `discharge_date`, `ward`, `bed_number`, `attending_doctor`, `status` (admitted/discharged), `created_at` |

### 3.3 Prescriptions

| Entity                 | Purpose                                                                     | Key Fields                                                                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **prescriptions**      | Header for a prescription. Links to patient and optionally to an admission. | `id`, `prescription_number` (unique), `patient_id` (FK), `admission_id` (FK, nullable), `prescriber_name`, `prescription_date`, `status` (pending/partially_dispensed/fully_dispensed/cancelled), `notes`, `created_by`, `created_at` |
| **prescription_items** | Individual items on a prescription.                                         | `id`, `prescription_id` (FK), `medicine_id` (FK), `prescribed_quantity`, `dispensed_quantity` (running total), `dosage_instructions`, `status` (pending/partially_dispensed/fully_dispensed/cancelled), `notes`                       |

### 3.4 Dispensing

| Entity                 | Purpose                                                                                        | Key Fields                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **dispensing_records** | A dispensing event against a prescription. Multiple records support partial/repeat dispensing. | `id`, `dispensing_number` (unique), `prescription_id` (FK), `dispensed_by` (FK to users), `dispensed_at`, `notes`, `created_at`             |
| **dispensing_items**   | Individual items dispensed in a dispensing event.                                              | `id`, `dispensing_record_id` (FK), `prescription_item_id` (FK), `medicine_batch_id` (FK), `quantity_dispensed`, `unit_price`, `total_price` |

### 3.5 Medicine Catalogue & Inventory

| Entity               | Purpose                                                                 | Key Fields                                                                                                                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **medicines**        | Master catalogue of medicines.                                          | `id`, `name`, `generic_name`, `dosage_form` (tablet/capsule/syrup/etc.), `strength`, `unit_of_measure`, `category`, `is_active`, `created_at`, `deleted_at`                                                                                                                                                      |
| **medicine_batches** | Batch-level inventory. Each batch has its own expiry date and quantity. | `id`, `medicine_id` (FK), `batch_number`, `expiry_date`, `quantity_on_hand`, `quantity_received`, `unit_cost`, `supplier_id` (FK, nullable), `goods_receipt_item_id` (FK, nullable), `status` (available/expired/recalled/depleted), `created_at`                                                                |
| **stock_movements**  | Immutable log of every stock change.                                    | `id`, `medicine_batch_id` (FK), `movement_type` (receipt/dispensing/adjustment/return/expired_write_off), `quantity` (positive for additions, negative for deductions), `reference_type` (dispensing_item/goods_receipt_item/adjustment), `reference_id`, `reason`, `performed_by` (FK to users), `performed_at` |

> [!IMPORTANT]
> `medicine_batches.quantity_on_hand` is the authoritative stock level. It is updated only within transactions that also write to `stock_movements`. The sum of all movements for a batch should always equal the current `quantity_on_hand`. This invariant can be verified by a reconciliation query.

### 3.6 Suppliers & Purchasing

| Entity                   | Purpose                                                         | Key Fields                                                                                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **suppliers**            | Supplier directory.                                             | `id`, `name`, `contact_person`, `phone`, `email`, `address`, `ntn_number`, `is_active`, `created_at`, `deleted_at`                                                                                                  |
| **purchase_orders**      | Orders placed with suppliers.                                   | `id`, `po_number` (unique), `supplier_id` (FK), `order_date`, `expected_delivery_date`, `status` (draft/submitted/partially_received/fully_received/cancelled), `total_amount`, `notes`, `created_by`, `created_at` |
| **purchase_order_items** | Line items on a purchase order.                                 | `id`, `purchase_order_id` (FK), `medicine_id` (FK), `quantity_ordered`, `quantity_received` (running total), `unit_price`, `total_price`                                                                            |
| **goods_receipts**       | Record of goods received against a purchase order.              | `id`, `grn_number` (unique, Goods Receipt Note), `purchase_order_id` (FK), `supplier_id` (FK), `received_date`, `received_by` (FK to users), `notes`, `created_at`                                                  |
| **goods_receipt_items**  | Items received in a GRN, creating or updating medicine batches. | `id`, `goods_receipt_id` (FK), `purchase_order_item_id` (FK, nullable), `medicine_id` (FK), `batch_number`, `expiry_date`, `quantity_received`, `unit_cost`, `total_cost`                                           |

### 3.7 Supplier Payables

| Entity                | Purpose                                  | Key Fields                                                                                                                                                                               |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **supplier_invoices** | Invoices received from suppliers.        | `id`, `invoice_number`, `supplier_id` (FK), `goods_receipt_id` (FK, nullable), `invoice_date`, `due_date`, `total_amount`, `status` (pending/partially_paid/paid/disputed), `created_at` |
| **supplier_payments** | Payments made against supplier invoices. | `id`, `supplier_invoice_id` (FK), `payment_date`, `amount`, `payment_method`, `reference_number`, `notes`, `approved_by` (FK to users), `created_at`                                     |

### 3.8 Hospital Claims & Billing

| Entity              | Purpose                                             | Key Fields                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **claims**          | Claims submitted to the hospital for reimbursement. | `id`, `claim_number` (unique), `claim_period_start`, `claim_period_end`, `total_amount`, `status` (draft/submitted/under_review/approved/partially_approved/rejected/paid), `submitted_by`, `submitted_at`, `notes`, `created_at` |
| **claim_items**     | Individual items included in a claim.               | `id`, `claim_id` (FK), `dispensing_record_id` (FK), `medicine_id` (FK), `quantity`, `unit_rate`, `total_amount`, `status` (pending/approved/rejected), `rejection_reason`                                                         |
| **claim_approvals** | Approval/rejection actions on a claim.              | `id`, `claim_id` (FK), `action` (approved/partially_approved/rejected/returned), `approved_by` (FK to users), `approved_amount`, `comments`, `approved_at`                                                                        |
| **claim_payments**  | Payments received from the hospital against claims. | `id`, `claim_id` (FK), `payment_date`, `amount`, `payment_method`, `reference_number`, `received_by` (FK to users), `created_at`                                                                                                  |

> [!NOTE]
> Claim rates (the `unit_rate` on claim items) must be configurable. The hospital may set different rates for different medicines or categories. This rate structure has **not been confirmed** by the client and must not be hard-coded.

### 3.9 Audit & Notifications

| Entity            | Purpose                                    | Key Fields                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **audit_events**  | Immutable log of all sensitive operations. | `id`, `event_type`, `entity_type`, `entity_id`, `user_id` (FK), `action` (create/update/delete/dispense/adjust/approve/etc.), `old_values` (JSONB, nullable), `new_values` (JSONB, nullable), `ip_address`, `user_agent`, `created_at` |
| **notifications** | System-generated notifications for users.  | `id`, `user_id` (FK), `type` (low_stock/expiry_alert/approval_needed/payment_due), `title`, `message`, `reference_type`, `reference_id`, `is_read`, `created_at`, `read_at`                                                            |

### 3.10 Configuration

| Entity            | Purpose                                                     | Key Fields                                                                       |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **system_config** | Key-value configuration for business rules that may change. | `id`, `key` (unique), `value` (JSONB), `description`, `updated_by`, `updated_at` |

---

## 4. Critical Constraints and Invariants

### 4.1 Stock Integrity

| Constraint                                             | Enforcement                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `quantity_on_hand >= 0`                                | `CHECK` constraint on `medicine_batches`.                      |
| Stock deduction only within transactions               | Application-level enforcement + `SELECT FOR UPDATE` row locks. |
| Sum of `stock_movements.quantity` = `quantity_on_hand` | Periodic reconciliation query. Mismatch triggers alert.        |
| Expired batches cannot be dispensed                    | Application check + database CHECK/trigger if feasible.        |

### 4.2 Dispensing Integrity

| Constraint                                           | Enforcement                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `dispensed_quantity <= prescribed_quantity` per item | Application check within transaction.                              |
| Dispensing record must reference valid prescription  | Foreign key.                                                       |
| Prescription status reflects dispensing progress     | Updated within the same transaction as dispensing.                 |
| Duplicate dispensing prevention                      | Idempotency key on dispensing request + prescription status check. |

### 4.3 Financial Integrity

| Constraint                                  | Enforcement                                     |
| ------------------------------------------- | ----------------------------------------------- |
| Payment amounts are non-negative            | `CHECK` constraint.                             |
| Total payments do not exceed invoice amount | Application check within transaction.           |
| Claim amounts align with dispensed records  | Application validation during claim generation. |

### 4.4 Referential Integrity

All foreign keys have explicit `ON DELETE` behavior:

| Relationship                   | ON DELETE                                                       |
| ------------------------------ | --------------------------------------------------------------- |
| Patient → Admission            | `RESTRICT` (cannot delete patient with admissions)              |
| Prescription → Dispensing      | `RESTRICT`                                                      |
| Medicine → Batch               | `RESTRICT`                                                      |
| Batch → Stock Movement         | `RESTRICT`                                                      |
| Purchase Order → Goods Receipt | `RESTRICT`                                                      |
| Claim → Claim Items            | `CASCADE` (draft claims only; submitted claims use soft delete) |

---

## 5. Indexing Strategy (Preliminary)

Indexes will be designed based on query patterns. The following are anticipated:

| Table                | Index                                  | Rationale                                      |
| -------------------- | -------------------------------------- | ---------------------------------------------- |
| `patients`           | `mr_number` (unique)                   | Primary lookup by medical record number.       |
| `patients`           | `cnic`                                 | Search by national ID.                         |
| `patients`           | `full_name` (trigram / `gin_trgm_ops`) | Fuzzy name search.                             |
| `prescriptions`      | `patient_id`, `status`                 | Find active prescriptions for a patient.       |
| `prescriptions`      | `prescription_number` (unique)         | Lookup by number.                              |
| `medicine_batches`   | `medicine_id`, `status`, `expiry_date` | Find available batches (FEFO ordering).        |
| `medicine_batches`   | `expiry_date`                          | Expiry alert queries.                          |
| `stock_movements`    | `medicine_batch_id`, `performed_at`    | Movement history for a batch.                  |
| `dispensing_records` | `prescription_id`                      | Find all dispensing events for a prescription. |
| `audit_events`       | `entity_type`, `entity_id`             | Audit trail for a specific entity.             |
| `audit_events`       | `user_id`, `created_at`                | User activity log.                             |
| `purchase_orders`    | `supplier_id`, `status`                | Orders by supplier.                            |
| `claims`             | `status`, `submitted_at`               | Pending claims for review.                     |
| `notifications`      | `user_id`, `is_read`                   | Unread notifications for a user.               |

---

## 6. Transaction Boundaries

The following operations require database transactions:

| Operation              | Tables Affected                                                                                                                           | Transaction Type                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **Dispense medicines** | `dispensing_records`, `dispensing_items`, `prescription_items`, `prescriptions`, `medicine_batches`, `stock_movements`, `audit_events`    | Read-write with row locks (`FOR UPDATE` on batches) |
| **Receive goods**      | `goods_receipts`, `goods_receipt_items`, `medicine_batches`, `purchase_order_items`, `purchase_orders`, `stock_movements`, `audit_events` | Read-write                                          |
| **Stock adjustment**   | `medicine_batches`, `stock_movements`, `audit_events`                                                                                     | Read-write with row lock                            |
| **Submit claim**       | `claims`, `claim_items`, `audit_events`                                                                                                   | Read-write                                          |
| **Approve claim**      | `claims`, `claim_approvals`, `audit_events`                                                                                               | Read-write                                          |
| **Record payment**     | `supplier_payments` or `claim_payments`, `invoices` or `claims` (status update), `audit_events`                                           | Read-write                                          |

> [!TIP]
> Complex transactions (especially dispensing) should be implemented as PostgreSQL functions (`RPC`) called from the application. This keeps the transaction boundary tight and avoids multiple round-trips between the application and database.

---

## 7. Data Retention Considerations

| Data Type                  | Retention                           | Notes                                                                 |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Patient records            | Indefinite (soft delete)            | May need to align with local regulations.                             |
| Prescriptions & dispensing | Indefinite                          | Required for audit trail and claim validation.                        |
| Stock movements            | Indefinite                          | Essential for reconciliation and audit.                               |
| Audit events               | Indefinite (archive after 2+ years) | May be moved to cold storage for performance.                         |
| Notifications              | 90 days (configurable)              | Read notifications can be purged.                                     |
| Financial records          | 7+ years minimum                    | Standard financial record retention. Must confirm local requirements. |

> [!WARNING]
> Data retention policies for medical and financial records in Pakistan have not been confirmed with the client. See [`OPEN_QUESTIONS.md`](file:///t:/DHQ%20KOhat%20Project/docs/OPEN_QUESTIONS.md) — OQ-007.

---

## 8. Seed Data Strategy

For development and testing, the system will use realistic but clearly fictional dummy data:

- Patient names will use obviously fictional names (e.g., "Test Patient A-001").
- Financial figures will use realistic ranges but are not based on actual rates.
- All seed data records will be clearly marked or prefixed.
- Seed data will be loaded via a dedicated script that checks the environment before execution.
- The seed script will **refuse to run** in a production environment.

---

## 9. Migration Strategy (Phase 3 — Planned)

When the database phase begins:

1. Migrations will be managed using Supabase CLI (`supabase migration new`).
2. Each migration will be a numbered, sequential SQL file.
3. Migrations will be version-controlled and peer-reviewed.
4. Destructive migrations (column drops, type changes) require explicit approval.
5. Seed data is separate from schema migrations.
6. A rollback plan will accompany every migration.
