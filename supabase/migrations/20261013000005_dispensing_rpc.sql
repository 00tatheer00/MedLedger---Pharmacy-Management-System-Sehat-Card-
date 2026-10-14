-- ==============================================================================
-- MedLedger — Atomic Dispensing & Stock Transaction RPC Functions
-- Migration: 20261013000005_dispensing_rpc.sql
-- Architecture: Modular Monolith (PostgreSQL / Supabase)
-- Target: DHQ Hospital Kohat central pharmacy
-- Version: 0.8.0 (Phase 8: Dispensing & Atomic Stock Transactions)
-- ==============================================================================

-- Ensure idempotency tracking column on dispensing_records
ALTER TABLE dispensing_records ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dispensing_records_idempotency
    ON dispensing_records (idempotency_key)
    WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;

-- 1. Atomic Dispensing Procedure
-- Executes multi-item prescription dispensing, row-level locks on batches and prescription items,
-- non-negative stock verification, append-only stock movement logging, and audit tracking in a single ACID transaction.

CREATE OR REPLACE FUNCTION fn_dispense_prescription_atomic(
    p_prescription_id UUID,
    p_dispensed_by UUID,
    p_notes TEXT,
    p_items JSONB, -- Array of objects: [{ prescription_item_id, medicine_batch_id, dispensed_medicine_id, quantity, unit_price, notes }]
    p_idempotency_key TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dispensing_record_id UUID;
    v_dispensing_number VARCHAR(50);
    v_item JSONB;
    v_rx_item RECORD;
    v_batch RECORD;
    v_qty_to_dispense INTEGER;
    v_unit_price NUMERIC(12, 2);
    v_total_price NUMERIC(12, 2);
    v_dispensed_med_id UUID;
    v_dispensing_item_id UUID;
    v_rx_record RECORD;
    v_all_rx_items_fully_dispensed BOOLEAN := TRUE;
    v_any_item_dispensed BOOLEAN := FALSE;
    v_new_rx_status VARCHAR(30);
BEGIN
    -- 0. Idempotency guard: block duplicate submissions with identical idempotency key
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
        IF EXISTS (
            SELECT 1 FROM dispensing_records
            WHERE idempotency_key = p_idempotency_key
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Duplicate dispensing transaction detected. Request with idempotency key % has already been processed.', p_idempotency_key;
        END IF;
    END IF;

    -- 1. Validate prescription exists and is active
    SELECT * INTO v_rx_record
    FROM prescriptions
    WHERE id = p_prescription_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prescription % does not exist or has been deleted.', p_prescription_id;
    END IF;

    IF v_rx_record.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot dispense cancelled prescription %.', v_rx_record.prescription_number;
    END IF;

    IF v_rx_record.status = 'fully_dispensed' THEN
        RAISE EXCEPTION 'Prescription % is already fully dispensed.', v_rx_record.prescription_number;
    END IF;

    -- 2. Generate unique dispensing number (DSP-YYYYMMDD-XXXX)
    v_dispensing_number := 'DSP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

    -- 3. Create dispensing header record
    INSERT INTO dispensing_records (
        dispensing_number,
        prescription_id,
        dispensed_by,
        dispensed_at,
        notes,
        idempotency_key,
        created_at,
        updated_at
    ) VALUES (
        v_dispensing_number,
        p_prescription_id,
        p_dispensed_by,
        NOW(),
        p_notes,
        p_idempotency_key,
        NOW(),
        NOW()
    ) RETURNING id INTO v_dispensing_record_id;

    -- 4. Process each line item in the atomic transaction
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty_to_dispense := (v_item->>'quantity')::INTEGER;
        v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0.00);
        v_total_price := ROUND((v_qty_to_dispense * v_unit_price)::NUMERIC, 2);
        v_dispensed_med_id := (v_item->>'dispensed_medicine_id')::UUID;

        IF v_qty_to_dispense <= 0 THEN
            RAISE EXCEPTION 'Dispensing quantity must be greater than zero.';
        END IF;

        -- 4.1 Lock and validate prescription line item
        SELECT * INTO v_rx_item
        FROM prescription_items
        WHERE id = (v_item->>'prescription_item_id')::UUID AND prescription_id = p_prescription_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Prescription item % not found for prescription %.', (v_item->>'prescription_item_id'), p_prescription_id;
        END IF;

        IF (v_rx_item.dispensed_quantity + v_qty_to_dispense) > v_rx_item.prescribed_quantity THEN
            RAISE EXCEPTION 'Attempted over-dispense: remaining authorized quantity is %, requested %.',
                (v_rx_item.prescribed_quantity - v_rx_item.dispensed_quantity), v_qty_to_dispense;
        END IF;

        -- 4.2 Lock and validate medicine batch
        SELECT * INTO v_batch
        FROM medicine_batches
        WHERE id = (v_item->>'medicine_batch_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Batch % not found.', (v_item->>'medicine_batch_id');
        END IF;

        IF v_batch.status = 'quarantined' THEN
            RAISE EXCEPTION 'Batch % is quarantined and cannot be dispensed.', v_batch.batch_number;
        END IF;

        IF v_batch.status = 'expired' OR v_batch.expiry_date <= CURRENT_DATE THEN
            RAISE EXCEPTION 'Batch % has expired (%s) and cannot be dispensed.', v_batch.batch_number, v_batch.expiry_date;
        END IF;

        IF v_batch.quantity_on_hand < v_qty_to_dispense THEN
            RAISE EXCEPTION 'Insufficient stock in batch %: requested %, on-hand %.',
                v_batch.batch_number, v_qty_to_dispense, v_batch.quantity_on_hand;
        END IF;

        -- 4.3 Create dispensing line item
        INSERT INTO dispensing_items (
            dispensing_record_id,
            prescription_item_id,
            medicine_batch_id,
            dispensed_medicine_id,
            quantity_dispensed,
            unit_price,
            total_price,
            created_at
        ) VALUES (
            v_dispensing_record_id,
            v_rx_item.id,
            v_batch.id,
            v_dispensed_med_id,
            v_qty_to_dispense,
            v_unit_price,
            v_total_price,
            NOW()
        ) RETURNING id INTO v_dispensing_item_id;

        -- 4.4 Deduct stock from batch
        UPDATE medicine_batches
        SET quantity_on_hand = quantity_on_hand - v_qty_to_dispense,
            updated_at = NOW()
        WHERE id = v_batch.id;

        -- 4.5 Append immutable stock movement row
        INSERT INTO stock_movements (
            medicine_batch_id,
            movement_type,
            quantity,
            reference_type,
            reference_id,
            reason,
            performed_by,
            performed_at
        ) VALUES (
            v_batch.id,
            'dispensing',
            -v_qty_to_dispense,
            'dispensing_item',
            v_dispensing_item_id,
            'Dispensed against prescription ' || v_rx_record.prescription_number || ' (Dispensing ' || v_dispensing_number || ')',
            p_dispensed_by,
            NOW()
        );

        -- 4.6 Update prescription line item running total and status
        UPDATE prescription_items
        SET dispensed_quantity = dispensed_quantity + v_qty_to_dispense,
            status = CASE
                WHEN (dispensed_quantity + v_qty_to_dispense) = prescribed_quantity THEN 'fully_dispensed'
                ELSE 'partially_dispensed'
            END,
            updated_at = NOW()
        WHERE id = v_rx_item.id;
    END LOOP;

    -- 5. Recompute prescription overall status
    FOR v_rx_item IN
        SELECT prescribed_quantity, dispensed_quantity, status
        FROM prescription_items
        WHERE prescription_id = p_prescription_id
    LOOP
        IF v_rx_item.dispensed_quantity < v_rx_item.prescribed_quantity THEN
            v_all_rx_items_fully_dispensed := FALSE;
        END IF;
        IF v_rx_item.dispensed_quantity > 0 THEN
            v_any_item_dispensed := TRUE;
        END IF;
    END LOOP;

    v_new_rx_status := CASE
        WHEN v_all_rx_items_fully_dispensed THEN 'fully_dispensed'
        WHEN v_any_item_dispensed THEN 'partially_dispensed'
        ELSE 'pending'
    END;

    UPDATE prescriptions
    SET status = v_new_rx_status,
        updated_at = NOW()
    WHERE id = p_prescription_id;

    -- 6. Record audit event
    INSERT INTO audit_events (
        event_type,
        entity_type,
        entity_id,
        user_id,
        action,
        new_values,
        created_at
    ) VALUES (
        'dispensing_created',
        'dispensing_record',
        v_dispensing_record_id,
        p_dispensed_by,
        'dispense',
        jsonb_build_object(
            'dispensing_number', v_dispensing_number,
            'prescription_id', p_prescription_id,
            'prescription_number', v_rx_record.prescription_number,
            'prescription_status', v_new_rx_status,
            'item_count', jsonb_array_length(p_items)
        ),
        NOW()
    );

    RETURN v_dispensing_record_id;
END;
$$;


-- 2. Atomic Dispensing Reversal Procedure
-- Reverses an authorized dispensing record, restores stock to the batches with compensating stock movements,
-- updates prescription item and header counters, and logs the reversal audit entry.

CREATE OR REPLACE FUNCTION fn_reverse_dispensing_atomic(
    p_dispensing_record_id UUID,
    p_reversed_by UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dispensing RECORD;
    v_item RECORD;
    v_rx RECORD;
    v_all_zero BOOLEAN := TRUE;
    v_all_full BOOLEAN := TRUE;
    v_new_rx_status VARCHAR(30);
BEGIN
    -- 1. Check dispensing record
    SELECT * INTO v_dispensing
    FROM dispensing_records
    WHERE id = p_dispensing_record_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dispensing record % not found.', p_dispensing_record_id;
    END IF;

    IF v_dispensing.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Dispensing record % has already been reversed or cancelled.', v_dispensing.dispensing_number;
    END IF;

    -- 2. Process each dispensing item: restore stock and log compensating movement
    FOR v_item IN
        SELECT di.*, mb.batch_number
        FROM dispensing_items di
        JOIN medicine_batches mb ON mb.id = di.medicine_batch_id
        WHERE di.dispensing_record_id = p_dispensing_record_id
    LOOP
        -- Restore stock to batch
        UPDATE medicine_batches
        SET quantity_on_hand = quantity_on_hand + v_item.quantity_dispensed,
            updated_at = NOW()
        WHERE id = v_item.medicine_batch_id;

        -- Append compensating stock movement
        INSERT INTO stock_movements (
            medicine_batch_id,
            movement_type,
            quantity,
            reference_type,
            reference_id,
            reason,
            performed_by,
            performed_at
        ) VALUES (
            v_item.medicine_batch_id,
            'return',
            v_item.quantity_dispensed,
            'manual_correction',
            v_item.id,
            'Compensating reversal for Dispensing ' || v_dispensing.dispensing_number || '. Reason: ' || p_reason,
            p_reversed_by,
            NOW()
        );

        -- Decrement prescription item dispensed quantity
        UPDATE prescription_items
        SET dispensed_quantity = GREATEST(0, dispensed_quantity - v_item.quantity_dispensed),
            status = CASE
                WHEN (dispensed_quantity - v_item.quantity_dispensed) <= 0 THEN 'pending'
                WHEN (dispensed_quantity - v_item.quantity_dispensed) >= prescribed_quantity THEN 'fully_dispensed'
                ELSE 'partially_dispensed'
            END,
            updated_at = NOW()
        WHERE id = v_item.prescription_item_id;
    END LOOP;

    -- 3. Mark dispensing record as reversed (soft delete with timestamp and notes)
    UPDATE dispensing_records
    SET deleted_at = NOW(),
        notes = COALESCE(notes || ' | ', '') || '[REVERSED by user ' || p_reversed_by::TEXT || ': ' || p_reason || ']',
        updated_at = NOW()
    WHERE id = p_dispensing_record_id;

    -- 4. Recompute parent prescription status
    SELECT * INTO v_rx FROM prescriptions WHERE id = v_dispensing.prescription_id FOR UPDATE;

    FOR v_item IN
        SELECT prescribed_quantity, dispensed_quantity
        FROM prescription_items
        WHERE prescription_id = v_dispensing.prescription_id
    LOOP
        IF v_item.dispensed_quantity > 0 THEN
            v_all_zero := FALSE;
        END IF;
        IF v_item.dispensed_quantity < v_item.prescribed_quantity THEN
            v_all_full := FALSE;
        END IF;
    END LOOP;

    v_new_rx_status := CASE
        WHEN v_all_full THEN 'fully_dispensed'
        WHEN NOT v_all_zero THEN 'partially_dispensed'
        ELSE 'pending'
    END;

    UPDATE prescriptions
    SET status = v_new_rx_status,
        updated_at = NOW()
    WHERE id = v_dispensing.prescription_id;

    -- 5. Record audit event
    INSERT INTO audit_events (
        event_type,
        entity_type,
        entity_id,
        user_id,
        action,
        new_values,
        created_at
    ) VALUES (
        'dispensing_reversed',
        'dispensing_record',
        p_dispensing_record_id,
        p_reversed_by,
        'reverse',
        jsonb_build_object(
            'dispensing_number', v_dispensing.dispensing_number,
            'prescription_id', v_dispensing.prescription_id,
            'reason', p_reason,
            'new_prescription_status', v_new_rx_status
        ),
        NOW()
    );

    RETURN TRUE;
END;
$$;
