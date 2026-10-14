-- ==============================================================================
-- MedLedger — Atomic Hospital Claims & Reimbursement RPC Functions
-- Migration: 20261013000006_claims_rpc.sql
-- Architecture: Modular Monolith (PostgreSQL / Supabase)
-- Target: DHQ Hospital Kohat central pharmacy
-- Version: 0.9.0 (Phase 9: Hospital Claims & Billing Workflow)
-- ==============================================================================

-- 1. Update Claim Status Constraint to support full lifecycle
-- Supported states: draft, submitted, under_review, approved, partially_approved, rejected, returned, partially_paid, paid, cancelled
ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_status_check;
ALTER TABLE claims DROP CONSTRAINT IF EXISTS chk_claims_status;
ALTER TABLE claims ADD CONSTRAINT chk_claims_status
    CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'partially_approved', 'rejected', 'returned', 'partially_paid', 'paid', 'cancelled'));

-- 2. Atomic Claim Creation Procedure
-- Validates eligible finalized dispensing records, prevents duplicate claiming,
-- enforces exact line-item linkage to dispensing_items, calculates totals, and logs audit events.
-- IMPORTANT INVARIANT: Claim creation NEVER modifies inventory or stock_movements!

CREATE OR REPLACE FUNCTION fn_create_claim_atomic(
    p_claim_period_start DATE,
    p_claim_period_end DATE,
    p_notes TEXT,
    p_items JSONB, -- Array of [{ dispensing_record_id, dispensing_item_id, medicine_id, quantity, unit_rate }]
    p_submitted_by UUID,
    p_status VARCHAR(30) DEFAULT 'draft'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_claim_id UUID;
    v_claim_number VARCHAR(50);
    v_item JSONB;
    v_disp_item RECORD;
    v_disp_record RECORD;
    v_already_claimed INTEGER;
    v_requested_qty INTEGER;
    v_unit_rate NUMERIC(12, 2);
    v_line_total NUMERIC(12, 2);
    v_total_amount NUMERIC(12, 2) := 0;
    v_submitted_at TIMESTAMPTZ := NULL;
BEGIN
    -- 1. Validate date bounds
    IF p_claim_period_end < p_claim_period_start THEN
        RAISE EXCEPTION 'Claim period end date (%) cannot be earlier than start date (%).', p_claim_period_end, p_claim_period_start;
    END IF;

    -- 2. Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'A claim must contain at least one dispensing line item.';
    END IF;

    -- 3. Validate status
    IF p_status NOT IN ('draft', 'submitted') THEN
        RAISE EXCEPTION 'New claims can only be created with status "draft" or "submitted". Received: %', p_status;
    END IF;

    IF p_status = 'submitted' THEN
        v_submitted_at := NOW();
    END IF;

    -- 4. Generate unique claim reference (CLM-YYYYMMDD-XXXX)
    v_claim_number := 'CLM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- 5. Insert claims header
    INSERT INTO claims (
        claim_number,
        claim_period_start,
        claim_period_end,
        total_amount,
        approved_amount,
        status,
        submitted_by,
        submitted_at,
        notes,
        created_at,
        updated_at
    ) VALUES (
        v_claim_number,
        p_claim_period_start,
        p_claim_period_end,
        0, -- updated after calculating line items
        0,
        p_status,
        p_submitted_by,
        v_submitted_at,
        p_notes,
        NOW(),
        NOW()
    ) RETURNING id INTO v_claim_id;

    -- 6. Process each claim item with row locks and duplicate verification
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_requested_qty := (v_item->>'quantity')::INTEGER;
        v_unit_rate := (v_item->>'unit_rate')::NUMERIC(12, 2);

        IF v_requested_qty <= 0 THEN
            RAISE EXCEPTION 'Claimed quantity must be greater than zero.';
        END IF;

        IF v_unit_rate < 0 THEN
            RAISE EXCEPTION 'Unit rate cannot be negative.';
        END IF;

        -- Verify and lock dispensing item
        SELECT di.*, dr.deleted_at, dr.dispensing_number
        INTO v_disp_item
        FROM dispensing_items di
        JOIN dispensing_records dr ON dr.id = di.dispensing_record_id
        WHERE di.id = (v_item->>'dispensing_item_id')::UUID
          AND di.dispensing_record_id = (v_item->>'dispensing_record_id')::UUID
          AND di.dispensed_medicine_id = (v_item->>'medicine_id')::UUID
        FOR UPDATE OF di;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Dispensing item % does not exist or does not match specified record and medicine.', v_item->>'dispensing_item_id';
        END IF;

        -- Check dispensing record is active (not reversed)
        IF v_disp_item.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot claim dispensing item from reversed dispensing record %.', v_disp_item.dispensing_number;
        END IF;

        -- Calculate already claimed quantity across active claims (excluding cancelled/rejected)
        SELECT COALESCE(SUM(ci.quantity), 0) INTO v_already_claimed
        FROM claim_items ci
        JOIN claims c ON c.id = ci.claim_id
        WHERE ci.dispensing_item_id = v_disp_item.id
          AND c.deleted_at IS NULL
          AND c.status NOT IN ('cancelled', 'rejected');

        IF (v_already_claimed + v_requested_qty) > v_disp_item.quantity_dispensed THEN
            RAISE EXCEPTION 'Cannot claim % units of dispensing item %. Already claimed: % units, total dispensed: % units.',
                v_requested_qty, v_disp_item.id, v_already_claimed, v_disp_item.quantity_dispensed;
        END IF;

        v_line_total := ROUND((v_requested_qty * v_unit_rate)::NUMERIC, 2);
        v_total_amount := v_total_amount + v_line_total;

        -- Insert line item
        INSERT INTO claim_items (
            claim_id,
            dispensing_record_id,
            dispensing_item_id,
            medicine_id,
            quantity,
            unit_rate,
            total_amount,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_claim_id,
            v_disp_item.dispensing_record_id,
            v_disp_item.id,
            v_disp_item.dispensed_medicine_id,
            v_requested_qty,
            v_unit_rate,
            v_line_total,
            'pending',
            NOW(),
            NOW()
        );
    END LOOP;

    -- 7. Update header total amount
    UPDATE claims
    SET total_amount = v_total_amount,
        updated_at = NOW()
    WHERE id = v_claim_id;

    -- 8. Write audit log entry
    INSERT INTO audit_events (
        event_type,
        entity_type,
        entity_id,
        user_id,
        action,
        new_values,
        created_at
    ) VALUES (
        'claim_created',
        'claims',
        v_claim_id,
        p_submitted_by,
        'create',
        jsonb_build_object(
            'claim_number', v_claim_number,
            'status', p_status,
            'total_amount', v_total_amount,
            'item_count', jsonb_array_length(p_items)
        ),
        NOW()
    );

    RETURN v_claim_id;
END;
$$;

-- 3. Atomic Claim Review & Approval Procedure
-- Transitions claim status, updates approved amounts, sets item-level statuses,
-- inserts into claim_approvals, and ensures audit trail.

CREATE OR REPLACE FUNCTION fn_review_claim_atomic(
    p_claim_id UUID,
    p_action VARCHAR(30), -- 'approved', 'partially_approved', 'rejected', 'returned'
    p_approved_amount NUMERIC(12, 2),
    p_comments TEXT,
    p_approved_by UUID,
    p_item_reviews JSONB DEFAULT '[]'::JSONB -- Optional array of [{ claim_item_id, status, rejection_reason }]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_claim RECORD;
    v_item JSONB;
    v_new_status VARCHAR(30);
BEGIN
    -- 1. Validate action
    IF p_action NOT IN ('approved', 'partially_approved', 'rejected', 'returned') THEN
        RAISE EXCEPTION 'Invalid review action: %. Must be approved, partially_approved, rejected, or returned.', p_action;
    END IF;

    -- Rejection, return, or partial approval require explanatory comments
    IF p_action IN ('rejected', 'returned', 'partially_approved') AND (p_comments IS NULL OR TRIM(p_comments) = '') THEN
        RAISE EXCEPTION 'Comments are mandatory when rejecting, returning, or partially approving a claim.';
    END IF;

    -- 2. Lock claim record
    SELECT * INTO v_claim
    FROM claims
    WHERE id = p_claim_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim % does not exist.', p_claim_id;
    END IF;

    -- Only submitted or under_review claims can be reviewed
    IF v_claim.status NOT IN ('submitted', 'under_review') THEN
        RAISE EXCEPTION 'Cannot review claim % with status "%". Claim must be submitted or under review.', v_claim.claim_number, v_claim.status;
    END IF;

    -- Validate approved amount
    IF p_action = 'rejected' THEN
        p_approved_amount := 0;
        v_new_status := 'rejected';
    ELSIF p_action = 'returned' THEN
        p_approved_amount := 0;
        v_new_status := 'returned';
    ELSIF p_action = 'approved' THEN
        v_new_status := 'approved';
        IF p_approved_amount > v_claim.total_amount THEN
            RAISE EXCEPTION 'Approved amount (%) cannot exceed submitted total (%).', p_approved_amount, v_claim.total_amount;
        END IF;
    ELSIF p_action = 'partially_approved' THEN
        v_new_status := 'partially_approved';
        IF p_approved_amount <= 0 OR p_approved_amount >= v_claim.total_amount THEN
            RAISE EXCEPTION 'Partially approved amount (%) must be greater than zero and less than total amount (%).', p_approved_amount, v_claim.total_amount;
        END IF;
    END IF;

    -- 3. Insert claim approval decision
    INSERT INTO claim_approvals (
        claim_id,
        action,
        approved_by,
        approved_amount,
        comments,
        approved_at
    ) VALUES (
        p_claim_id,
        p_action,
        p_approved_by,
        p_approved_amount,
        p_comments,
        NOW()
    );

    -- 4. Process line-item statuses if provided
    IF p_item_reviews IS NOT NULL AND jsonb_array_length(p_item_reviews) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_item_reviews)
        LOOP
            UPDATE claim_items
            SET status = v_item->>'status',
                rejection_reason = v_item->>'rejection_reason',
                updated_at = NOW()
            WHERE id = (v_item->>'claim_item_id')::UUID
              AND claim_id = p_claim_id;
        END LOOP;
    ELSIF p_action = 'approved' THEN
        -- Default all items to approved
        UPDATE claim_items
        SET status = 'approved',
            updated_at = NOW()
        WHERE claim_id = p_claim_id;
    ELSIF p_action = 'rejected' THEN
        -- Default all items to rejected
        UPDATE claim_items
        SET status = 'rejected',
            rejection_reason = p_comments,
            updated_at = NOW()
        WHERE claim_id = p_claim_id;
    END IF;

    -- 5. Update claim header
    UPDATE claims
    SET status = v_new_status,
        approved_amount = p_approved_amount,
        updated_at = NOW()
    WHERE id = p_claim_id;

    -- 6. Audit log entry
    INSERT INTO audit_events (
        event_type,
        entity_type,
        entity_id,
        user_id,
        action,
        old_values,
        new_values,
        created_at
    ) VALUES (
        'claim_reviewed',
        'claims',
        p_claim_id,
        p_approved_by,
        'review',
        jsonb_build_object('status', v_claim.status, 'approved_amount', v_claim.approved_amount),
        jsonb_build_object('action', p_action, 'status', v_new_status, 'approved_amount', p_approved_amount, 'comments', p_comments),
        NOW()
    );

    RETURN p_claim_id;
END;
$$;

-- 4. Atomic Claim Payment Recording Procedure
-- Records reimbursement payment from DHQ Hospital, updates claim paid status,
-- prevents over-payment against approved_amount, and creates audit log.

CREATE OR REPLACE FUNCTION fn_record_claim_payment_atomic(
    p_claim_id UUID,
    p_payment_date DATE,
    p_amount NUMERIC(12, 2),
    p_payment_method VARCHAR(50),
    p_reference_number TEXT,
    p_received_by UUID,
    p_notes TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_claim RECORD;
    v_payment_id UUID;
    v_total_paid NUMERIC(12, 2);
    v_new_total_paid NUMERIC(12, 2);
    v_new_status VARCHAR(30);
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    -- 1. Lock claim record
    SELECT * INTO v_claim
    FROM claims
    WHERE id = p_claim_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim % does not exist.', p_claim_id;
    END IF;

    -- Claim must be in an approved state to receive reimbursement payments
    IF v_claim.status NOT IN ('approved', 'partially_approved', 'partially_paid') THEN
        RAISE EXCEPTION 'Cannot record payment for claim % with status "%". Claim must be approved, partially_approved, or partially_paid.',
            v_claim.claim_number, v_claim.status;
    END IF;

    -- 2. Calculate existing payments
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM claim_payments
    WHERE claim_id = p_claim_id;

    v_new_total_paid := v_total_paid + p_amount;

    IF v_new_total_paid > v_claim.approved_amount THEN
        RAISE EXCEPTION 'Payment of % exceeds outstanding approved balance of % (Approved: %, Already Paid: %).',
            p_amount, (v_claim.approved_amount - v_total_paid), v_claim.approved_amount, v_total_paid;
    END IF;

    -- 3. Insert claim payment
    INSERT INTO claim_payments (
        claim_id,
        payment_date,
        amount,
        payment_method,
        reference_number,
        received_by,
        notes,
        created_at
    ) VALUES (
        p_claim_id,
        p_payment_date,
        p_amount,
        p_payment_method,
        p_reference_number,
        p_received_by,
        p_notes,
        NOW()
    ) RETURNING id INTO v_payment_id;

    -- 4. Update claim status based on total paid vs approved amount
    IF v_new_total_paid >= v_claim.approved_amount THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := 'partially_paid';
    END IF;

    UPDATE claims
    SET status = v_new_status,
        updated_at = NOW()
    WHERE id = p_claim_id;

    -- 5. Audit log entry
    INSERT INTO audit_events (
        event_type,
        entity_type,
        entity_id,
        user_id,
        action,
        new_values,
        created_at
    ) VALUES (
        'claim_payment_recorded',
        'claim_payments',
        v_payment_id,
        p_received_by,
        'create',
        jsonb_build_object(
            'claim_id', p_claim_id,
            'claim_number', v_claim.claim_number,
            'amount', p_amount,
            'total_paid', v_new_total_paid,
            'approved_amount', v_claim.approved_amount,
            'status', v_new_status,
            'payment_method', p_payment_method,
            'reference_number', p_reference_number
        ),
        NOW()
    );

    RETURN v_payment_id;
END;
$$;
