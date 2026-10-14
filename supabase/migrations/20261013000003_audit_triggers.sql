-- ==============================================================================
-- MedLedger — Audit & Trigger Infrastructure
-- Migration: 20261013000003_audit_triggers.sql
-- Architecture: Database-level Immutability and Automated Timestamps
-- Target: DHQ Hospital Kohat central pharmacy
-- Version: 0.3.0 (Phase 3: Database & Security Foundation)
-- ==============================================================================

-- ==============================================================================
-- 1. IMMUTABILITY TRIGGER FOR AUDIT EVENTS
-- ==============================================================================

-- Prevents any modification or deletion of audit logs at the database engine level
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit records are immutable and cannot be modified or deleted. Action attempted: %', TG_OP
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON audit_events;
CREATE TRIGGER trg_prevent_audit_tampering
    BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_tampering();

-- Immutability trigger on stock_movements as well
CREATE OR REPLACE FUNCTION prevent_stock_movement_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Stock movement records are immutable. Adjustments must be recorded as compensatory stock movements. Action attempted: %', TG_OP
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_stock_movement_tampering ON stock_movements;
CREATE TRIGGER trg_prevent_stock_movement_tampering
    BEFORE UPDATE OR DELETE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION prevent_stock_movement_tampering();

-- ==============================================================================
-- 2. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to all mutable tables
CREATE OR REPLACE TRIGGER trg_profiles_timestamp BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_patients_timestamp BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_admissions_timestamp BEFORE UPDATE ON admissions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_medicines_timestamp BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_batches_timestamp BEFORE UPDATE ON medicine_batches FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_prescriptions_timestamp BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_prescription_items_timestamp BEFORE UPDATE ON prescription_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_dispensing_timestamp BEFORE UPDATE ON dispensing_records FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_suppliers_timestamp BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_po_timestamp BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_po_items_timestamp BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_grn_timestamp BEFORE UPDATE ON goods_receipts FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_supplier_invoices_timestamp BEFORE UPDATE ON supplier_invoices FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_claims_timestamp BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_claim_items_timestamp BEFORE UPDATE ON claim_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_system_config_timestamp BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ==============================================================================
-- 3. AUTOMATED USER PROFILE SYNCHRONIZATION WITH SUPABASE AUTH
-- ==============================================================================

-- When an account is created in auth.users by an administrator, automatically
-- insert a matching profile entry in the public profiles table.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pharmacy Staff Member'),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        TRUE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
