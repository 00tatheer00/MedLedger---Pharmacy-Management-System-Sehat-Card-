-- ==============================================================================
-- MedLedger — Atomic Supplier Payment Allocation & Financial Reconciliation
-- Migration: 20261013000007_finance_reconciliation_rpc.sql
-- Architecture: Modular Monolith (PostgreSQL / Supabase)
-- Target: DHQ Hospital Kohat central pharmacy
-- Version: 0.10.0 (Phase 10: Finance, Payments, Reconciliation & Reports)
-- ==============================================================================

-- 1. Create Supplier Payment Allocations Table
-- Supports 1:N payment voucher to invoice allocations with exact decimal precision.
CREATE TABLE IF NOT EXISTS supplier_payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES supplier_payments(id) ON DELETE CASCADE,
    supplier_invoice_id UUID NOT NULL REFERENCES supplier_invoices(id) ON DELETE RESTRICT,
    amount_allocated NUMERIC(12, 2) NOT NULL CHECK (amount_allocated > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_supplier_payment_invoice UNIQUE (payment_id, supplier_invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_spa_payment ON supplier_payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_spa_invoice ON supplier_payment_allocations(supplier_invoice_id);

-- Enable RLS on supplier_payment_allocations
ALTER TABLE supplier_payment_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supplier_payment_allocations_select" ON supplier_payment_allocations;
CREATE POLICY "supplier_payment_allocations_select"
    ON supplier_payment_allocations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('system_admin', 'pharmacy_manager', 'purchasing_staff', 'finance_staff')
        )
    );

DROP POLICY IF EXISTS "supplier_payment_allocations_manage" ON supplier_payment_allocations;
CREATE POLICY "supplier_payment_allocations_manage"
    ON supplier_payment_allocations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('system_admin', 'pharmacy_manager', 'purchasing_staff', 'finance_staff')
        )
    );

-- 2. Atomic Supplier Payment Recording Procedure
-- Enforces:
-- - Exact decimal balance arithmetic (NUMERIC 12,2)
-- - Row locking on target supplier invoices (FOR UPDATE)
-- - Prevention of overpayment on any invoice
-- - Equal matching of voucher amount to sum of allocations
-- - Same-supplier validation (cross-supplier allocation prohibited)
-- - Atomic invoice balance updates and audit event generation

CREATE OR REPLACE FUNCTION fn_record_supplier_payment_atomic(
    p_supplier_id UUID,
    p_payment_date DATE,
    p_amount NUMERIC(12, 2),
    p_payment_method VARCHAR(50),
    p_reference_number VARCHAR(100),
    p_notes TEXT,
    p_approved_by UUID,
    p_allocations JSONB -- Array of [{ invoice_id: UUID, amount_allocated: NUMERIC }]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARe
    v_payment_id UUID;
    v_voucher_number VARCHAR(50);
    v_alloc JSONB;
    v_inv RECORD;
    v_total_allocated NUMERIC(12, 2) := 0;
    v_alloc_amount NUMERIC(12, 2);
    v_inv_id UUID;
    v_new_paid NUMERIC(12, 2);
    v_new_status VARCHAR(30);
BEGIN
    -- 1. Validate payment amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    -- 2. Validate allocations exist
    IF p_allocations IS NULL OR jsonb_array_length(p_allocations) = 0 THEN
        RAISE EXCEPTION 'A supplier payment must include at least one invoice allocation.';
    END IF;

    -- 3. Verify total allocated equals payment amount
    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
        v_alloc_amount := (v_alloc->>'amount_allocated')::NUMERIC(12, 2);
        IF v_alloc_amount <= 0 THEN
            RAISE EXCEPTION 'Allocation amount must be greater than zero.';
        END IF;
        v_total_allocated := v_total_allocated + v_alloc_amount;
    END LOOP;

    IF v_total_allocated <> p_amount THEN
        RAISE EXCEPTION 'Sum of allocated amounts (%) must exactly equal payment amount (%).',
            v_total_allocated, p_amount;
    END IF;

    -- 4. Generate unique payment voucher number
    v_voucher_number := 'PV-' || TO_CHAR(p_payment_date, 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- 5. Insert supplier payment record
    INSERT INTO supplier_payments (
        payment_voucher_number,
        supplier_id,
        supplier_invoice_id,
        payment_date,
        amount,
        payment_method,
        reference_number,
        notes,
        approved_by,
        created_at
    ) VALUES (
        v_voucher_number,
        p_supplier_id,
        NULL, -- Multi-invoice allocations stored in supplier_payment_allocations
        p_payment_date,
        p_amount,
        p_payment_method,
        p_reference_number,
        p_notes,
        p_approved_by,
        NOW()
    ) RETURNING id INTO v_payment_id;

    -- 6. Lock and update each invoice, recording individual allocations
    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
        v_inv_id := (v_alloc->>'invoice_id')::UUID;
        v_alloc_amount := (v_alloc->>'amount_allocated')::NUMERIC(12, 2);

        -- Lock invoice record FOR UPDATE
        SELECT * INTO v_inv
        FROM supplier_invoices
        WHERE id = v_inv_id AND deleted_at IS NULL
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Supplier invoice % not found or deleted.', v_inv_id;
        END IF;

        IF v_inv.supplier_id <> p_supplier_id THEN
            RAISE EXCEPTION 'Invoice % belongs to another supplier. Cross-supplier payment prohibited.', v_inv.invoice_number;
        END IF;

        IF (v_inv.paid_amount + v_alloc_amount) > v_inv.total_amount THEN
            RAISE EXCEPTION 'Allocation of % exceeds outstanding balance of % on invoice %.',
                v_alloc_amount, (v_inv.total_amount - v_inv.paid_amount), v_inv.invoice_number;
        END IF;

        -- Insert allocation line
        INSERT INTO supplier_payment_allocations (
            payment_id,
            supplier_invoice_id,
            amount_allocated,
            created_at
        ) VALUES (
            v_payment_id,
            v_inv_id,
            v_alloc_amount,
            NOW()
        );

        -- Update invoice paid amount and status
        v_new_paid := v_inv.paid_amount + v_alloc_amount;
        IF v_new_paid >= v_inv.total_amount THEN
            v_new_status := 'paid';
        ELSE
            v_new_status := 'partially_paid';
        END IF;

        UPDATE supplier_invoices
        SET paid_amount = v_new_paid,
            status = v_new_status,
            updated_at = NOW()
        WHERE id = v_inv_id;
    END LOOP;

    -- 7. Audit log entry
    INSERT INTO audit_events (
        event_type,
        entity_type,
        entity_id,
        user_id,
        action,
        new_values,
        created_at
    ) VALUES (
        'supplier_payment_recorded',
        'supplier_payments',
        v_payment_id,
        p_approved_by,
        'create',
        jsonb_build_object(
            'voucher_number', v_voucher_number,
            'supplier_id', p_supplier_id,
            'amount', p_amount,
            'payment_method', p_payment_method,
            'reference_number', p_reference_number,
            'allocations_count', jsonb_array_length(p_allocations)
        ),
        NOW()
    );

    RETURN v_payment_id;
END;
$$;

-- 3. Financial Reconciliation View
-- Identifies payment-to-allocation discrepancies across payables and claims.
CREATE OR REPLACE VIEW v_financial_reconciliation AS
SELECT
    'supplier_payment' AS flow_type,
    sp.id AS transaction_id,
    sp.payment_voucher_number AS reference_number,
    sp.payment_date AS transaction_date,
    s.name AS counterparty_name,
    sp.amount AS recorded_amount,
    COALESCE(SUM(spa.amount_allocated), 0) AS allocated_amount,
    (sp.amount - COALESCE(SUM(spa.amount_allocated), 0)) AS unallocated_amount,
    CASE
        WHEN sp.amount = COALESCE(SUM(spa.amount_allocated), 0) THEN 'fully_allocated'
        WHEN COALESCE(SUM(spa.amount_allocated), 0) = 0 THEN 'unallocated'
        WHEN COALESCE(SUM(spa.amount_allocated), 0) < sp.amount THEN 'partially_allocated'
        ELSE 'over_allocated_discrepancy'
    END AS reconciliation_status
FROM supplier_payments sp
JOIN suppliers s ON sp.supplier_id = s.id
LEFT JOIN supplier_payment_allocations spa ON sp.id = spa.payment_id
GROUP BY sp.id, sp.payment_voucher_number, sp.payment_date, s.name, sp.amount

UNION ALL

SELECT
    'hospital_claim_receipt' AS flow_type,
    cp.id AS transaction_id,
    COALESCE(cp.reference_number, cp.id::TEXT) AS reference_number,
    cp.payment_date AS transaction_date,
    'DHQ Kohat Treasury' AS counterparty_name,
    cp.amount AS recorded_amount,
    cp.amount AS allocated_amount,
    0.00 AS unallocated_amount,
    CASE
        WHEN c.id IS NULL THEN 'orphaned_discrepancy'
        WHEN c.status NOT IN ('approved', 'partially_approved', 'partially_paid', 'paid') THEN 'ineligible_status_discrepancy'
        ELSE 'fully_allocated'
    END AS reconciliation_status
FROM claim_payments cp
LEFT JOIN claims c ON cp.claim_id = c.id;
