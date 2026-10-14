-- ==============================================================================
-- MedLedger — Core Database Schema Migration
-- Migration: 20261013000001_core_schema.sql
-- Architecture: Modular Monolith (PostgreSQL / Supabase)
-- Target: DHQ Hospital Kohat central pharmacy
-- Version: 0.3.0 (Phase 3: Database & Security Foundation)
-- ==============================================================================
-- Design Notes:
-- 1. UUID primary keys across all entities (gen_random_uuid()).
-- 2. Monetary amounts use NUMERIC(12, 2) (no floating point calculations).
-- 3. All timestamps stored as TIMESTAMPTZ in UTC.
-- 4. Soft-delete tables use partial unique indexes (WHERE deleted_at IS NULL).
-- 5. Foreign keys enforce referential integrity at the database level.
-- 6. Claim items link directly to dispensing items for itemized auditability.
-- 7. Dispensing items record dispensed_medicine_id to trace substitutions.
-- ==============================================================================

-- Ensure pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. IDENTITY & ACCESS CONTROL (5 Tables)
-- ==============================================================================

-- 1.1 User Profiles (mirrors auth.users 1:1)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- matches auth.users(id)
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Partial index for active profiles
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(email) WHERE is_active = TRUE AND deleted_at IS NULL;

-- 1.2 System Roles (Provisional 5 roles)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 User-to-Role Assignment
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- 1.4 Granular System Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'medicines:read', 'dispensing:create'
    module VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- 1.5 Role-to-Permission Assignment
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);

-- ==============================================================================
-- 2. PATIENTS & HOSPITAL ADMISSIONS (2 Tables)
-- ==============================================================================

-- 2.1 Patients Directory
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mr_number VARCHAR(50) NOT NULL, -- Medical Record Number
    full_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    cnic VARCHAR(15), -- Format: 00000-0000000-0
    date_of_birth DATE,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Partial unique index allowing identifier re-use if soft-deleted
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_mr_number ON patients(mr_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_cnic ON patients(cnic) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name) WHERE deleted_at IS NULL;

-- 2.2 Hospital Admissions
CREATE TABLE IF NOT EXISTS admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    admission_number VARCHAR(50) NOT NULL,
    admission_date TIMESTAMPTZ NOT NULL,
    discharge_date TIMESTAMPTZ,
    ward VARCHAR(100) NOT NULL,
    bed_number VARCHAR(30),
    attending_doctor VARCHAR(150),
    status VARCHAR(20) NOT NULL CHECK (status IN ('admitted', 'discharged', 'transferred', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_discharge_after_admission CHECK (discharge_date IS NULL OR discharge_date >= admission_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admissions_number ON admissions(admission_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admissions_patient ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status) WHERE deleted_at IS NULL;

-- ==============================================================================
-- 3. MEDICINE CATALOGUE & INVENTORY (3 Tables)
-- ==============================================================================

-- 3.1 Medicines Master Catalogue
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL, -- tablet, syrup, vial, ampoule, etc.
    strength VARCHAR(50) NOT NULL,    -- 500mg, 1g, 250mg/5ml
    unit_of_measure VARCHAR(30) NOT NULL, -- tablet, bottle, vial, box
    category VARCHAR(100) NOT NULL,   -- Antibiotic, Analgesic, Cardiovascular
    min_threshold INTEGER NOT NULL DEFAULT 10 CHECK (min_threshold >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_medicines_name_strength ON medicines(name, strength) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category) WHERE deleted_at IS NULL;

-- 3.2 Medicine Batches (Authoritative Stock)
CREATE TABLE IF NOT EXISTS medicine_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_received INTEGER NOT NULL CHECK (quantity_received >= 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    supplier_id UUID, -- Will reference suppliers table defined below
    goods_receipt_item_id UUID,
    status VARCHAR(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'quarantined', 'expired', 'recalled', 'depleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_batches_medicine ON medicine_batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON medicine_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON medicine_batches(status);

-- 3.3 Stock Movements (Immutable audit log of all stock mutations)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_batch_id UUID NOT NULL REFERENCES medicine_batches(id) ON DELETE RESTRICT,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('receipt', 'dispensing', 'adjustment', 'return', 'expired_write_off')),
    quantity INTEGER NOT NULL, -- positive for additions, negative for deductions
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('dispensing_item', 'goods_receipt_item', 'inventory_adjustment', 'manual_correction')),
    reference_id UUID NOT NULL,
    reason TEXT,
    performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements(medicine_batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_perf ON stock_movements(performed_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id);

-- ==============================================================================
-- 4. PRESCRIPTIONS (2 Tables)
-- ==============================================================================

-- 4.1 Prescription Headers
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(50) NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    admission_id UUID REFERENCES admissions(id) ON DELETE RESTRICT,
    prescriber_name VARCHAR(150) NOT NULL,
    prescription_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_dispensed', 'fully_dispensed', 'cancelled')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions(prescription_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date);

-- 4.2 Prescription Line Items
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    prescribed_quantity INTEGER NOT NULL CHECK (prescribed_quantity > 0),
    dispensed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (dispensed_quantity >= 0),
    dosage_instructions TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_dispensed', 'fully_dispensed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dispensed_lte_prescribed CHECK (dispensed_quantity <= prescribed_quantity)
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_rx ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_med ON prescription_items(medicine_id);

-- ==============================================================================
-- 5. DISPENSING (2 Tables)
-- ==============================================================================

-- 5.1 Dispensing Records (Header)
CREATE TABLE IF NOT EXISTS dispensing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensing_number VARCHAR(50) NOT NULL,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE RESTRICT,
    dispensed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dispensing_number ON dispensing_records(dispensing_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dispensing_rx ON dispensing_records(prescription_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_user ON dispensing_records(dispensed_by);
CREATE INDEX IF NOT EXISTS idx_dispensing_date ON dispensing_records(dispensed_at);

-- 5.2 Dispensing Line Items
CREATE TABLE IF NOT EXISTS dispensing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensing_record_id UUID NOT NULL REFERENCES dispensing_records(id) ON DELETE RESTRICT,
    prescription_item_id UUID NOT NULL REFERENCES prescription_items(id) ON DELETE RESTRICT,
    medicine_batch_id UUID NOT NULL REFERENCES medicine_batches(id) ON DELETE RESTRICT,
    dispensed_medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT, -- Preserves substitution traceability
    quantity_dispensed INTEGER NOT NULL CHECK (quantity_dispensed > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispensing_items_record ON dispensing_items(dispensing_record_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_items_rx_item ON dispensing_items(prescription_item_id);
CREATE INDEX IF NOT EXISTS idx_dispensing_items_batch ON dispensing_items(medicine_batch_id);

-- ==============================================================================
-- 6. SUPPLIERS & PURCHASING (5 Tables)
-- ==============================================================================

-- 6.1 Suppliers Master
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    ntn_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_ntn ON suppliers(ntn_number) WHERE deleted_at IS NULL AND ntn_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name) WHERE deleted_at IS NULL;

-- Add deferred foreign key to medicine_batches
ALTER TABLE medicine_batches
    ADD CONSTRAINT fk_batches_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- 6.2 Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'partially_received', 'fully_received', 'cancelled')),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status) WHERE deleted_at IS NULL;

-- 6.3 Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INTEGER NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_med ON purchase_order_items(medicine_id);

-- 6.4 Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_number VARCHAR(50) NOT NULL UNIQUE,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    received_date DATE NOT NULL,
    received_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipts(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_supplier ON goods_receipts(supplier_id);

-- 6.5 Goods Receipt Items
CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    purchase_order_item_id UUID REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
    unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(12, 2) NOT NULL CHECK (total_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grn_items_receipt ON goods_receipt_items(goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_med ON goods_receipt_items(medicine_id);

-- ==============================================================================
-- 7. SUPPLIER PAYABLES (2 Tables)
-- ==============================================================================

-- 7.1 Supplier Invoices
CREATE TABLE IF NOT EXISTS supplier_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    goods_receipt_id UUID REFERENCES goods_receipts(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'disputed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_invoices_number ON supplier_invoices(supplier_id, invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices(status) WHERE deleted_at IS NULL;

-- 7.2 Supplier Payments
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_voucher_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    approved_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice ON supplier_payments(supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);

-- ==============================================================================
-- 8. HOSPITAL CLAIMS & BILLING (4 Tables)
-- ==============================================================================

-- 8.1 Claims Header
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(50) NOT NULL,
    claim_period_start DATE NOT NULL,
    claim_period_end DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    approved_amount NUMERIC(12, 2) DEFAULT 0 CHECK (approved_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'paid', 'cancelled')),
    submitted_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    submitted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_claim_dates CHECK (claim_period_end >= claim_period_start)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_number ON claims(claim_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status) WHERE deleted_at IS NULL;

-- 8.2 Claim Line Items (Exact fulfillment traceability to dispensing item)
CREATE TABLE IF NOT EXISTS claim_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT, -- Enforced as RESTRICT at DDL level
    dispensing_record_id UUID NOT NULL REFERENCES dispensing_records(id) ON DELETE RESTRICT,
    dispensing_item_id UUID NOT NULL REFERENCES dispensing_items(id) ON DELETE RESTRICT, -- Direct line-item FK
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_rate NUMERIC(12, 2) NOT NULL CHECK (unit_rate >= 0), -- Configurable claim rate
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_claim_item_dispensing UNIQUE (claim_id, dispensing_item_id) -- Prevents duplicate claiming
);

CREATE INDEX IF NOT EXISTS idx_claim_items_claim ON claim_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_items_disp_item ON claim_items(dispensing_item_id);

-- 8.3 Claim Review Approvals / Decisions
CREATE TABLE IF NOT EXISTS claim_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    action VARCHAR(30) NOT NULL CHECK (action IN ('approved', 'partially_approved', 'rejected', 'returned')),
    approved_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    approved_amount NUMERIC(12, 2) NOT NULL CHECK (approved_amount >= 0),
    comments TEXT,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_approvals_claim ON claim_approvals(claim_id);

-- 8.4 Claim Reimbursement Payments
CREATE TABLE IF NOT EXISTS claim_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    received_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_payments_claim ON claim_payments(claim_id);

-- ==============================================================================
-- 9. AUDIT, NOTIFICATIONS & SYSTEM CONFIG (3 Tables)
-- ==============================================================================

-- 9.1 Audit Events (Append-only immutable operational log)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,   -- 'dispensing:create', 'inventory:adjust', 'auth:login'
    entity_type VARCHAR(50) NOT NULL,  -- 'dispensing_records', 'medicine_batches', 'claims'
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL,       -- 'create', 'update', 'delete', 'dispense', 'approve'
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);

-- 9.2 Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('low_stock', 'expiry_alert', 'approval_needed', 'payment_due', 'system')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- 9.3 System Configuration (Configurable rates, thresholds, rules)
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
