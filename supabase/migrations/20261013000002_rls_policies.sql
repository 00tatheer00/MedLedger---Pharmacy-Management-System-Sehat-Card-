-- ==============================================================================
-- MedLedger — Row Level Security (RLS) Policies
-- Migration: 20261013000002_rls_policies.sql
-- Architecture: Multi-layered Role-Based Access Control
-- Target: DHQ Hospital Kohat central pharmacy
-- Version: 0.3.0 (Phase 3: Database & Security Foundation)
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY HELPER FUNCTIONS
-- ==============================================================================

-- 1.1 Retrieve active role names for the authenticated user
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN profiles p ON ur.user_id = p.id
        WHERE ur.user_id = user_uuid
          AND p.is_active = TRUE
          AND p.deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.2 Check if the authenticated caller has a specific role (or is system_admin)
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    user_roles_arr TEXT[];
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    user_roles_arr := get_user_roles(current_user_id);
    RETURN ('system_admin' = ANY(user_roles_arr)) OR (required_role = ANY(user_roles_arr));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.3 Check if caller has any of the listed roles (or is system_admin)
CREATE OR REPLACE FUNCTION has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    user_roles_arr TEXT[];
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    user_roles_arr := get_user_roles(current_user_id);
    IF 'system_admin' = ANY(user_roles_arr) THEN
        RETURN TRUE;
    END IF;

    RETURN user_roles_arr && required_roles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1.4 Helper checking if caller is system administrator
CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_role('system_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL 28 TABLES (Default Deny)
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE dispensing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensing_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_payments ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. IDENTITY & ACCESS CONTROL POLICIES
-- ==============================================================================

-- 3.1 Profiles
CREATE POLICY "profiles_select_own_or_admin"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR auth_is_admin());

CREATE POLICY "profiles_insert_admin_only"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth_is_admin());

CREATE POLICY "profiles_update_own_or_admin"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR auth_is_admin())
    WITH CHECK (
        -- Regular user cannot self-promote, change email, or change active status
        (auth_is_admin()) OR (
            id = auth.uid() AND
            email = (SELECT email FROM profiles WHERE id = auth.uid()) AND
            is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
        )
    );

-- 3.2 Roles & Permissions (Read by authenticated, written only by system_admin)
CREATE POLICY "roles_select_authenticated" ON roles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "roles_manage_admin" ON roles FOR ALL TO authenticated USING (auth_is_admin());

CREATE POLICY "permissions_select_authenticated" ON permissions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "permissions_manage_admin" ON permissions FOR ALL TO authenticated USING (auth_is_admin());

CREATE POLICY "role_permissions_select_authenticated" ON role_permissions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "role_permissions_manage_admin" ON role_permissions FOR ALL TO authenticated USING (auth_is_admin());

-- 3.3 User Roles (Strictly admin managed to prevent self-elevation)
CREATE POLICY "user_roles_select_authenticated" ON user_roles FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "user_roles_manage_admin" ON user_roles FOR ALL TO authenticated USING (auth_is_admin());

-- ==============================================================================
-- 4. CLINICAL & PATIENT POLICIES
-- ==============================================================================

-- 4.1 Patients & Admissions (Pharmacists, Pharmacy Managers, System Admins)
CREATE POLICY "patients_select_clinical"
    ON patients FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "patients_insert_clinical"
    ON patients FOR INSERT
    TO authenticated
    WITH CHECK (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "patients_update_clinical"
    ON patients FOR UPDATE
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "admissions_select_clinical"
    ON admissions FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "admissions_insert_clinical"
    ON admissions FOR INSERT
    TO authenticated
    WITH CHECK (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "admissions_update_clinical"
    ON admissions FOR UPDATE
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

-- 4.2 Prescriptions & Items
CREATE POLICY "prescriptions_select_clinical"
    ON prescriptions FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "prescriptions_insert_clinical"
    ON prescriptions FOR INSERT
    TO authenticated
    WITH CHECK (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "prescriptions_update_clinical"
    ON prescriptions FOR UPDATE
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "prescription_items_select_clinical"
    ON prescription_items FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "prescription_items_manage_clinical"
    ON prescription_items FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

-- ==============================================================================
-- 5. DISPENSING POLICIES
-- ==============================================================================

-- 5.1 Dispensing Records (Finance staff can view for audit & claim creation)
CREATE POLICY "dispensing_select"
    ON dispensing_records FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager', 'finance_staff']));

CREATE POLICY "dispensing_insert"
    ON dispensing_records FOR INSERT
    TO authenticated
    WITH CHECK (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

CREATE POLICY "dispensing_update"
    ON dispensing_records FOR UPDATE
    TO authenticated
    USING (has_any_role(ARRAY['pharmacy_manager']));

-- 5.2 Dispensing Items
CREATE POLICY "dispensing_items_select"
    ON dispensing_items FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager', 'finance_staff']));

CREATE POLICY "dispensing_items_insert"
    ON dispensing_items FOR INSERT
    TO authenticated
    WITH CHECK (has_any_role(ARRAY['pharmacist', 'pharmacy_manager']));

-- ==============================================================================
-- 6. MEDICINES & INVENTORY POLICIES
-- ==============================================================================

-- 6.1 Medicines Master
CREATE POLICY "medicines_select_authenticated"
    ON medicines FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "medicines_manage_privileged"
    ON medicines FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['pharmacy_manager', 'purchasing_staff']));

-- 6.2 Batches
CREATE POLICY "batches_select_authenticated"
    ON medicine_batches FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager', 'purchasing_staff', 'finance_staff']));

CREATE POLICY "batches_manage_privileged"
    ON medicine_batches FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['pharmacy_manager', 'purchasing_staff']));

-- 6.3 Stock Movements (Immutable: SELECT and INSERT only, NO UPDATE or DELETE)
CREATE POLICY "stock_movements_select"
    ON stock_movements FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacist', 'pharmacy_manager', 'purchasing_staff']));

CREATE POLICY "stock_movements_insert"
    ON stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (has_any_role(ARRAY['pharmacist', 'pharmacy_manager', 'purchasing_staff']));

-- ==============================================================================
-- 7. PURCHASING & SUPPLIERS POLICIES
-- ==============================================================================

CREATE POLICY "suppliers_select_purchasing"
    ON suppliers FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager', 'finance_staff']));

CREATE POLICY "suppliers_manage_purchasing"
    ON suppliers FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager']));

CREATE POLICY "po_select_purchasing"
    ON purchase_orders FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager', 'finance_staff']));

CREATE POLICY "po_manage_purchasing"
    ON purchase_orders FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager']));

CREATE POLICY "po_items_select"
    ON purchase_order_items FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager', 'finance_staff']));

CREATE POLICY "po_items_manage"
    ON purchase_order_items FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager']));

CREATE POLICY "grn_select"
    ON goods_receipts FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager', 'finance_staff']));

CREATE POLICY "grn_manage"
    ON goods_receipts FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager']));

CREATE POLICY "grn_items_select"
    ON goods_receipt_items FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager', 'finance_staff']));

CREATE POLICY "grn_items_manage"
    ON goods_receipt_items FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['purchasing_staff', 'pharmacy_manager']));

-- ==============================================================================
-- 8. PAYABLES POLICIES
-- ==============================================================================

CREATE POLICY "supplier_invoices_select"
    ON supplier_invoices FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "supplier_invoices_manage"
    ON supplier_invoices FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "supplier_payments_select"
    ON supplier_payments FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "supplier_payments_manage"
    ON supplier_payments FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

-- ==============================================================================
-- 9. CLAIMS & HOSPITAL BILLING POLICIES
-- ==============================================================================

CREATE POLICY "claims_select_finance"
    ON claims FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "claims_manage_finance"
    ON claims FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "claim_items_select_finance"
    ON claim_items FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "claim_items_manage_finance"
    ON claim_items FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "claim_approvals_select"
    ON claim_approvals FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "claim_approvals_manage"
    ON claim_approvals FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "claim_payments_select"
    ON claim_payments FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

CREATE POLICY "claim_payments_manage"
    ON claim_payments FOR ALL
    TO authenticated
    USING (has_any_role(ARRAY['finance_staff', 'pharmacy_manager']));

-- ==============================================================================
-- 10. AUDIT, NOTIFICATIONS & SYSTEM CONFIG POLICIES
-- ==============================================================================

-- 10.1 Audit Events (Strict access: Only system_admin and pharmacy_manager can read)
CREATE POLICY "audit_events_select"
    ON audit_events FOR SELECT
    TO authenticated
    USING (has_any_role(ARRAY['pharmacy_manager']));

CREATE POLICY "audit_events_insert"
    ON audit_events FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- 10.2 Notifications (Users see their own notifications or admin sees all)
CREATE POLICY "notifications_select_own"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR auth_is_admin());

CREATE POLICY "notifications_update_own"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR auth_is_admin());

CREATE POLICY "notifications_insert_system"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- 10.3 System Config
CREATE POLICY "system_config_select_authenticated"
    ON system_config FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "system_config_manage_admin"
    ON system_config FOR ALL
    TO authenticated
    USING (auth_is_admin());
