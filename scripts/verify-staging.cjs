/**
 * MedLedger — Real Staging PostgreSQL Integration & Workflow Verification
 *
 * Executes full ACID integration tests and clinical workflow validations
 * directly against the remote Supabase PostgreSQL staging cluster.
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

async function runStagingVerification() {
  console.log('===============================================================');
  console.log('MEDLEDGER — REAL STAGING SUPABASE VERIFICATION SUITE');
  console.log('Facility: DHQ Hospital Kohat');
  console.log('Environment: Isolated Staging PostgreSQL Cluster');
  console.log('===============================================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !anonKey || !serviceKey || !dbUrl) {
    console.error('ERROR: Required environment variables are missing.');
    process.exit(1);
  }

  // 1. Direct PG Admin client
  const pgClient = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  // 2. Supabase Service Role client
  const adminClient = createClient(supabaseUrl, serviceKey);

  // 3. Supabase Anon client
  const anonClient = createClient(supabaseUrl, anonKey);

  const results = [];
  function logPass(name, detail) {
    console.log(`[PASS] ${name}: ${detail}`);
    results.push({ test: name, status: 'PASS', detail });
  }
  function logFail(name, detail) {
    console.error(`[FAIL] ${name}: ${detail}`);
    results.push({ test: name, status: 'FAIL', detail });
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: RLS Enforcement & Unauthorized Record Access
    // -----------------------------------------------------------------
    console.log('\n--- TEST 1: RLS Enforcement & Unauthorized Write Access ---');
    const { error: anonInsertError } = await anonClient
      .from('patients')
      .insert({ full_name: 'Intruder Patient', mr_number: 'ATTACK-999' });

    if (anonInsertError && anonInsertError.code === '42501') {
      logPass(
        'RLS Authorization Boundary',
        `Unauthenticated insert rejected by RLS (PG Error 42501: ${anonInsertError.message})`
      );
    } else {
      logFail('RLS Authorization Boundary', `Expected 42501, got: ${JSON.stringify(anonInsertError)}`);
    }

    // -----------------------------------------------------------------
    // TEST 2: Master Patient and Prescription Persistence
    // -----------------------------------------------------------------
    console.log('\n--- TEST 2: Patient and Prescription Persistence ---');
    const testMrn = `MRN-STG-${Date.now().toString().slice(-6)}`;
    const { data: patient, error: patientError } = await adminClient
      .from('patients')
      .insert({
        mr_number: testMrn,
        full_name: 'Muhammad Zahid (Synthetic Staging Patient)',
        gender: 'male',
        date_of_birth: '1985-06-15',
        phone: '03001234567',
        cnic: '14301-1234567-1',
        address: 'Kohat City, KP',
      })
      .select()
      .single();

    if (patientError || !patient) {
      logFail('Patient Persistence', `Failed to create patient: ${patientError?.message}`);
      return;
    }
    logPass('Patient Persistence', `Created test patient ID ${patient.id} with MRN ${patient.mr_number}`);

    // Create a staff profile for transactions
    const { data: profile } = await adminClient
      .from('profiles')
      .upsert({
        id: 'b0000000-0000-0000-0000-000000000001',
        full_name: 'Dr. Tariq Khan (Staging Staff Pharmacist)',
        email: 'tariq.khan.staging@dhqkohat.gov.pk',
      })
      .select()
      .single();

    // -----------------------------------------------------------------
    // TEST 3: Medicine, Batch & Non-Negative Inventory
    // -----------------------------------------------------------------
    console.log('\n--- TEST 3: Medicine, Batch & Inventory Persistence ---');
    const itemCode = `MED-STG-${Date.now().toString().slice(-5)}`;
    const { data: medicine, error: medError } = await adminClient
      .from('medicines')
      .insert({
        item_code: itemCode,
        name: `Amoxicillin 500mg (${itemCode})`,
        generic_name: 'Amoxicillin Trihydrate',
        dosage_form: 'capsule',
        strength: '500mg',
        unit_of_measure: 'capsule',
        category: 'Antibiotic',
        min_threshold: 10,
        is_active: true,
      })
      .select()
      .single();

    if (medError || !medicine) {
      logFail('Medicine Persistence', `Failed to create medicine: ${medError?.message}`);
      return;
    }
    logPass('Medicine Persistence', `Created catalogue SKU ${medicine.name} (${medicine.item_code})`);

    const batchNumber = `B-STG-${Date.now().toString().slice(-4)}`;
    const { data: batch, error: batchError } = await adminClient
      .from('medicine_batches')
      .insert({
        medicine_id: medicine.id,
        batch_number: batchNumber,
        expiry_date: '2027-12-31',
        quantity_received: 100,
        quantity_on_hand: 50,
        unit_cost: 15.50,
        status: 'available',
      })
      .select()
      .single();

    if (batchError || !batch) {
      logFail('Batch Persistence', `Failed to create batch: ${batchError?.message}`);
      return;
    }
    logPass('Batch Persistence', `Created batch ${batch.batch_number} with 50 units on hand`);

    // Verify non-negative inventory constraint
    const { error: negStockError } = await adminClient
      .from('medicine_batches')
      .update({ quantity_on_hand: -10 })
      .eq('id', batch.id);

    if (negStockError) {
      logPass('Non-Negative Stock Constraint', `CHECK constraint prevented negative inventory balance (${negStockError.message})`);
    } else {
      logFail('Non-Negative Stock Constraint', 'Negative quantity update should have been blocked!');
    }

    // -----------------------------------------------------------------
    // TEST 4: Prescription Intake Workflow
    // -----------------------------------------------------------------
    console.log('\n--- TEST 4: Prescription Intake Workflow ---');
    const rxNumber = `RX-STG-${Date.now().toString().slice(-5)}`;
    const { data: rx, error: rxError } = await adminClient
      .from('prescriptions')
      .insert({
        patient_id: patient.id,
        prescription_number: rxNumber,
        prescriber_name: 'Dr. Farooq Shah (Consultant Physician)',
        prescription_date: new Date().toISOString().slice(0, 10),
        status: 'pending',
        created_by: profile.id,
      })
      .select()
      .single();

    if (rxError || !rx) {
      logFail('Prescription Intake', `Failed to create prescription: ${rxError?.message}`);
      return;
    }

    const { data: rxItem, error: rxItemError } = await adminClient
      .from('prescription_items')
      .insert({
        prescription_id: rx.id,
        medicine_id: medicine.id,
        prescribed_quantity: 20,
        dispensed_quantity: 0,
        dosage_instructions: '1 capsule three times daily for 7 days',
      })
      .select()
      .single();

    if (rxItemError || !rxItem) {
      logFail('Prescription Item Intake', `Failed to create rx line: ${rxItemError?.message}`);
      return;
    }
    logPass('Prescription Intake', `Prescription ${rx.prescription_number} recorded for 20 units with zero stock deduction`);

    // -----------------------------------------------------------------
    // TEST 5: Atomic Dispensing RPC (Partial Dispensing)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 5: Atomic Dispensing RPC (fn_dispense_prescription_atomic) ---');
    const idempotencyKey = `IDEMP-${Date.now()}`;
    const dispenseQty = 10;
    const dispenseUnitPrice = 25.00;

    const { data: dispensingRecordId, error: dispenseError } = await adminClient.rpc(
      'fn_dispense_prescription_atomic',
      {
        p_prescription_id: rx.id,
        p_dispensed_by: profile.id,
        p_notes: 'Synthetic staging partial dispense test',
        p_items: [
          {
            prescription_item_id: rxItem.id,
            medicine_batch_id: batch.id,
            dispensed_medicine_id: medicine.id,
            quantity: dispenseQty,
            unit_price: dispenseUnitPrice,
            notes: 'First 10 units dispensed',
          },
        ],
        p_idempotency_key: idempotencyKey,
      }
    );

    if (dispenseError || !dispensingRecordId) {
      logFail('Atomic Dispensing RPC', `Dispense transaction failed: ${dispenseError?.message}`);
      return;
    }
    logPass('Atomic Dispensing RPC', `Dispensing completed successfully. Transaction Record ID: ${dispensingRecordId}`);

    // Verify batch stock was deducted exactly from 50 to 40
    const { data: updatedBatch } = await adminClient
      .from('medicine_batches')
      .select('quantity_on_hand')
      .eq('id', batch.id)
      .single();

    if (updatedBatch?.quantity_on_hand === 40) {
      logPass('Atomic Stock Balance Update', `Batch balance deducted accurately: 50 -> 40 units`);
    } else {
      logFail('Atomic Stock Balance Update', `Expected 40 units, found ${updatedBatch?.quantity_on_hand}`);
    }

    // Verify immutable stock movement was logged
    const { data: movement } = await adminClient
      .from('stock_movements')
      .select('*')
      .eq('medicine_batch_id', batch.id)
      .order('performed_at', { ascending: false })
      .limit(1)
      .single();

    if (movement && movement.movement_type === 'dispensing' && movement.quantity === -10) {
      logPass('Immutable Stock Ledger', `Stock movement recorded: Type '${movement.movement_type}', Quantity ${movement.quantity}`);
    } else {
      logFail('Immutable Stock Ledger', `Stock movement check failed: ${JSON.stringify(movement)}`);
    }

    // Verify prescription status transitioned to 'partially_dispensed'
    const { data: updatedRx } = await adminClient
      .from('prescriptions')
      .select('status')
      .eq('id', rx.id)
      .single();

    if (updatedRx?.status === 'partially_dispensed') {
      logPass('Prescription State Machine', `Prescription transitioned accurately to '${updatedRx.status}'`);
    } else {
      logFail('Prescription State Machine', `Expected partially_dispensed, got ${updatedRx?.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 6: Duplicate-Submit & Idempotency Protection
    // -----------------------------------------------------------------
    console.log('\n--- TEST 6: Duplicate-Submit & Idempotency Protection ---');
    const { error: duplicateDispenseError } = await adminClient.rpc(
      'fn_dispense_prescription_atomic',
      {
        p_prescription_id: rx.id,
        p_dispensed_by: profile.id,
        p_notes: 'Duplicate submit replay attempt',
        p_items: [
          {
            prescription_item_id: rxItem.id,
            medicine_batch_id: batch.id,
            dispensed_medicine_id: medicine.id,
            quantity: dispenseQty,
            unit_price: dispenseUnitPrice,
          },
        ],
        p_idempotency_key: idempotencyKey,
      }
    );

    if (duplicateDispenseError) {
      logPass('Idempotency Key Protection', `Replay attempt was blocked: ${duplicateDispenseError.message}`);
    } else {
      logFail('Idempotency Key Protection', 'Duplicate submit should have raised an idempotency conflict!');
    }

    // -----------------------------------------------------------------
    // TEST 7: Transaction Rollback Verification (Stock Exhaustion)
    // -----------------------------------------------------------------
    console.log('\n--- TEST 7: Transaction Rollback on Over-Dispense ---');
    const { error: overDispenseError } = await adminClient.rpc(
      'fn_dispense_prescription_atomic',
      {
        p_prescription_id: rx.id,
        p_dispensed_by: profile.id,
        p_notes: 'Attempting to dispense 1000 units when only 40 are available',
        p_items: [
          {
            prescription_item_id: rxItem.id,
            medicine_batch_id: batch.id,
            dispensed_medicine_id: medicine.id,
            quantity: 1000,
            unit_price: dispenseUnitPrice,
          },
        ],
        p_idempotency_key: `OVER-${Date.now()}`,
      }
    );

    if (overDispenseError) {
      logPass('ACID Transaction Rollback', `Over-dispense transaction aborted cleanly: ${overDispenseError.message}`);
    } else {
      logFail('ACID Transaction Rollback', 'Transaction should have raised an exception and rolled back!');
    }

    // Confirm batch stock remained at 40
    const { data: rollbackBatch } = await adminClient
      .from('medicine_batches')
      .select('quantity_on_hand')
      .eq('id', batch.id)
      .single();

    if (rollbackBatch?.quantity_on_hand === 40) {
      logPass('Rollback Stock Invariant', `Stock verified unchanged at 40 units following rollback`);
    } else {
      logFail('Rollback Stock Invariant', `Stock corrupted after rollback! Balance: ${rollbackBatch?.quantity_on_hand}`);
    }

    // -----------------------------------------------------------------
    // TEST 8: Atomic Claim Creation from Dispensed Items
    // -----------------------------------------------------------------
    console.log('\n--- TEST 8: Atomic Claim Creation (fn_create_claim_atomic) ---');
    const { data: dispItems } = await adminClient
      .from('dispensing_items')
      .select('id, quantity_dispensed, unit_price')
      .eq('dispensing_record_id', dispensingRecordId);

    const targetDispItem = dispItems[0];
    const { data: claimId, error: claimError } = await adminClient.rpc(
      'fn_create_claim_atomic',
      {
        p_claim_period_start: '2026-10-01',
        p_claim_period_end: '2026-10-31',
        p_notes: 'Synthetic staging claim compilation',
        p_items: [
          {
            dispensing_record_id: dispensingRecordId,
            dispensing_item_id: targetDispItem.id,
            medicine_id: medicine.id,
            quantity: targetDispItem.quantity_dispensed,
            unit_rate: targetDispItem.unit_price,
          },
        ],
        p_submitted_by: profile.id,
        p_status: 'submitted',
      }
    );

    if (claimError || !claimId) {
      logFail('Atomic Claim Creation', `Failed to create claim: ${claimError?.message}`);
      return;
    }
    logPass('Atomic Claim Creation', `Hospital claim created from dispensing items. Claim ID: ${claimId}`);

    // Prevent duplicate claiming on same dispensing item
    const { error: dupClaimError } = await adminClient.rpc(
      'fn_create_claim_atomic',
      {
        p_claim_period_start: '2026-10-01',
        p_claim_period_end: '2026-10-31',
        p_notes: 'Duplicate claim attempt',
        p_items: [
          {
            dispensing_record_id: dispensingRecordId,
            dispensing_item_id: targetDispItem.id,
            medicine_id: medicine.id,
            quantity: targetDispItem.quantity_dispensed,
            unit_rate: targetDispItem.unit_price,
          },
        ],
        p_submitted_by: profile.id,
        p_status: 'submitted',
      }
    );

    if (dupClaimError) {
      logPass('Duplicate Claim Prevention', `Attempt to re-claim already claimed items blocked: ${dupClaimError.message}`);
    } else {
      logFail('Duplicate Claim Prevention', 'Duplicate claim should have been rejected!');
    }

    // -----------------------------------------------------------------
    // TEST 9: Supplier Payment Allocation & Reconciliation View
    // -----------------------------------------------------------------
    console.log('\n--- TEST 9: Supplier Invoicing, Payment Allocation & Reconciliation ---');
    const { data: supplier } = await adminClient
      .from('suppliers')
      .insert({
        name: 'Kohat Pharma Distributors (Staging Test)',
        contact_person: 'Amjad Ali',
        phone: '0922-123456',
        is_active: true,
      })
      .select()
      .single();

    const invNum = `INV-STG-${Date.now().toString().slice(-4)}`;
    const { data: invoice } = await adminClient
      .from('supplier_invoices')
      .insert({
        invoice_number: invNum,
        supplier_id: supplier.id,
        invoice_date: '2026-10-01',
        due_date: '2026-10-31',
        total_amount: 10000.00,
        paid_amount: 0.00,
        status: 'pending',
      })
      .select()
      .single();

    // Record atomic payment allocation of 6,000 PKR against the 10,000 PKR invoice
    const { data: paymentId, error: paymentError } = await adminClient.rpc(
      'fn_record_supplier_payment_atomic',
      {
        p_supplier_id: supplier.id,
        p_payment_date: '2026-10-14',
        p_amount: 6000.00,
        p_payment_method: 'Cheque',
        p_reference_number: 'CHQ-987654',
        p_notes: 'Partial invoice settlement',
        p_approved_by: profile.id,
        p_allocations: [
          {
            invoice_id: invoice.id,
            amount_allocated: 6000.00,
          },
        ],
      }
    );

    if (paymentError || !paymentId) {
      logFail('Supplier Payment Allocation', `Payment allocation failed: ${paymentError?.message}`);
      return;
    }
    logPass('Supplier Payment Allocation', `Payment voucher created (${paymentId}) allocating 6,000 PKR to invoice ${invNum}`);

    // Verify invoice paid_amount and status transitioned to 'partially_paid'
    const { data: updatedInvoice } = await adminClient
      .from('supplier_invoices')
      .select('paid_amount, status')
      .eq('id', invoice.id)
      .single();

    if (Number(updatedInvoice.paid_amount) === 6000 && updatedInvoice.status === 'partially_paid') {
      logPass('Invoice Balance State', `Invoice paid amount: 6,000 PKR, status: '${updatedInvoice.status}'`);
    } else {
      logFail('Invoice Balance State', `Unexpected invoice state: ${JSON.stringify(updatedInvoice)}`);
    }

    // Verify reconciliation view surfaces this transaction
    const { data: reconRows } = await adminClient
      .from('v_financial_reconciliation')
      .select('*')
      .eq('transaction_id', paymentId);

    if (reconRows && reconRows.length > 0 && reconRows[0].reconciliation_status === 'fully_allocated') {
      logPass('Financial Reconciliation View', `View v_financial_reconciliation verified: status '${reconRows[0].reconciliation_status}', unallocated balance ${reconRows[0].unallocated_amount} PKR`);
    } else {
      logFail('Financial Reconciliation View', `Reconciliation row check failed: ${JSON.stringify(reconRows)}`);
    }

    // -----------------------------------------------------------------
    // TEST 10: Audit Log Tamper Protection Trigger
    // -----------------------------------------------------------------
    console.log('\n--- TEST 10: Tamper-Proof Audit Trigger ---');
    try {
      await pgClient.query("UPDATE audit_events SET event_type = 'tampered' WHERE 1=1;");
      logFail('Audit Tamper Protection', 'Update on audit_events should have raised a SQL exception!');
    } catch (tamperErr) {
      logPass('Audit Tamper Protection', `Trigger successfully blocked UPDATE on audit_events: ${tamperErr.message}`);
    }

    try {
      await pgClient.query('DELETE FROM audit_events WHERE 1=1;');
      logFail('Audit Tamper Protection', 'DELETE on audit_events should have raised a SQL exception!');
    } catch (tamperErr) {
      logPass('Audit Tamper Protection', `Trigger successfully blocked DELETE on audit_events: ${tamperErr.message}`);
    }

    // -----------------------------------------------------------------
    // SUMMARY REPORT
    // -----------------------------------------------------------------
    console.log('\n===============================================================');
    console.log('STAGING VERIFICATION SUMMARY REPORT');
    console.log('===============================================================');
    const passedCount = results.filter((r) => r.status === 'PASS').length;
    const failedCount = results.filter((r) => r.status === 'FAIL').length;
    console.log(`Total Staging Integration Checks: ${results.length}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);

    if (failedCount === 0) {
      console.log('\nSTATUS: ALL REAL REMOTE STAGING VERIFICATIONS PASSED (100%)');
    } else {
      console.error(`\nSTATUS: ${failedCount} CHECKS FAILED`);
      process.exit(1);
    }

  } finally {
    await pgClient.end();
  }
}

runStagingVerification().catch((err) => {
  console.error('Fatal staging verification error:', err);
  process.exit(1);
});
