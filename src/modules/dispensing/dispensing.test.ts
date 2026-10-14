import { describe, it, expect, beforeEach } from 'vitest';
import { dispensingStore } from './prototype-store';
import { evaluateFEFOBatches, getRecommendedFEFOBatch } from './fefo';
import { dispensePrescriptionSchema, reverseDispensingSchema } from './validation';
import { inventoryStore } from '@/modules/inventory/prototype-store';
import { prescriptionStore } from '@/modules/prescriptions/prototype-store';
import { MedicineBatch } from '@/modules/inventory/types';

describe('Dispensing Module — FEFO Batch Allocation Engine', () => {
  const dummyBatches: MedicineBatch[] = [
    {
      id: 'bat-exp-01',
      medicine_id: 'med-001',
      batch_number: 'LOT-EXP-01',
      expiry_date: '2026-01-01', // Expired
      quantity_on_hand: 50,
      quantity_received: 50,
      unit_cost: 10,
      status: 'expired',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'bat-qrn-02',
      medicine_id: 'med-001',
      batch_number: 'LOT-QRN-02',
      expiry_date: '2027-01-01',
      quantity_on_hand: 100,
      quantity_received: 100,
      unit_cost: 10,
      status: 'quarantined',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'bat-dep-03',
      medicine_id: 'med-001',
      batch_number: 'LOT-DEP-03',
      expiry_date: '2027-06-01',
      quantity_on_hand: 0, // Depleted
      quantity_received: 100,
      unit_cost: 10,
      status: 'depleted',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'bat-late-04',
      medicine_id: 'med-001',
      batch_number: 'LOT-LATE-04',
      expiry_date: '2028-12-31', // Later expiry
      quantity_on_hand: 80,
      quantity_received: 80,
      unit_cost: 10,
      status: 'available',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'bat-early-05',
      medicine_id: 'med-001',
      batch_number: 'LOT-EARLY-05',
      expiry_date: '2027-03-15', // Earliest valid expiry
      quantity_on_hand: 60,
      quantity_received: 60,
      unit_cost: 10,
      status: 'available',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  it('correctly ranks earliest-expiring eligible batch as FEFO recommended', () => {
    const candidates = evaluateFEFOBatches(dummyBatches, 'med-001');
    expect(candidates.length).toBe(5);

    const recommended = candidates.find((c) => c.is_fefo_recommended);
    expect(recommended).toBeDefined();
    expect(recommended?.batch.batch_number).toBe('LOT-EARLY-05');
    expect(recommended?.is_eligible).toBe(true);
  });

  it('excludes expired, quarantined, and depleted batches from eligibility', () => {
    const candidates = evaluateFEFOBatches(dummyBatches, 'med-001');

    const exp = candidates.find((c) => c.batch.batch_number === 'LOT-EXP-01');
    expect(exp?.is_eligible).toBe(false);
    expect(exp?.ineligibility_reason).toContain('expired');

    const qrn = candidates.find((c) => c.batch.batch_number === 'LOT-QRN-02');
    expect(qrn?.is_eligible).toBe(false);
    expect(qrn?.ineligibility_reason).toContain('quarantined');

    const dep = candidates.find((c) => c.batch.batch_number === 'LOT-DEP-03');
    expect(dep?.is_eligible).toBe(false);
    expect(dep?.ineligibility_reason).toContain('depleted');
  });

  it('getRecommendedFEFOBatch returns earliest valid batch or null when none eligible', () => {
    const rec = getRecommendedFEFOBatch(dummyBatches, 'med-001');
    expect(rec?.batch_number).toBe('LOT-EARLY-05');

    const none = getRecommendedFEFOBatch(dummyBatches, 'non-existent-med');
    expect(none).toBeNull();
  });
});

describe('Dispensing Module — Validation Schemas', () => {
  it('validates a valid dispensing payload', () => {
    const valid = {
      prescription_id: 'rx-001-kohat',
      idempotency_key: 'test-key-101',
      items: [
        {
          prescription_item_id: 'rxi-001-01',
          medicine_batch_id: 'bat-003-kohat',
          dispensed_medicine_id: 'med-002',
          quantity: 2,
          unit_price: 250,
          is_substitution: false,
          is_fefo_override: false,
        },
      ],
    };

    const res = dispensePrescriptionSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects substitution without mandatory clinical reason', () => {
    const invalid = {
      prescription_id: 'rx-001-kohat',
      idempotency_key: 'test-key-102',
      items: [
        {
          prescription_item_id: 'rxi-001-01',
          medicine_batch_id: 'bat-003-kohat',
          dispensed_medicine_id: 'med-002',
          quantity: 2,
          unit_price: 250,
          is_substitution: true,
          substitution_reason: '', // missing
        },
      ],
    };

    const res = dispensePrescriptionSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects FEFO override without mandatory audit reason', () => {
    const invalid = {
      prescription_id: 'rx-001-kohat',
      idempotency_key: 'test-key-103',
      items: [
        {
          prescription_item_id: 'rxi-001-01',
          medicine_batch_id: 'bat-003-kohat',
          dispensed_medicine_id: 'med-002',
          quantity: 2,
          unit_price: 250,
          is_fefo_override: true,
          fefo_override_reason: 'ab', // too short (<3 chars)
        },
      ],
    };

    const res = dispensePrescriptionSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates reversal requires reason of at least 5 characters', () => {
    const resShort = reverseDispensingSchema.safeParse({
      dispensing_record_id: 'dsp-001',
      reason: 'bad',
    });
    expect(resShort.success).toBe(false);

    const resValid = reverseDispensingSchema.safeParse({
      dispensing_record_id: 'dsp-001',
      reason: 'Patient discharged prior to administration.',
    });
    expect(resValid.success).toBe(true);
  });
});

describe('Dispensing Module — Atomic Stock Transactions & Lifecycle', () => {
  const actor = { id: 'usr-pharmacist-001', name: 'Dr. Tariq Khan (Pharmacist)' };

  beforeEach(() => {
    dispensingStore.resetForTesting();
    inventoryStore.resetForTesting();
    prescriptionStore.reset();
  });

  it('executes successful full dispensing and updates stock movements', () => {
    // rx-001-kohat has rxi-001-01: Ceftriaxone (prescribed: 6, dispensed: 0)
    // bat-003-kohat has Ceftriaxone 1g with 150 units on hand
    const initialBatch = inventoryStore
      .getBatchesForMedicine('med-002')
      .find((b) => b.id === 'bat-003-kohat')!;
    const initialQty = initialBatch.quantity_on_hand;

    const result = dispensingStore.dispensePrescription(
      {
        prescription_id: 'rx-001-kohat',
        idempotency_key: 'idemp-disp-full-1',
        items: [
          {
            prescription_item_id: 'rxi-001-01',
            medicine_batch_id: 'bat-003-kohat',
            dispensed_medicine_id: 'med-002',
            quantity: 6,
            unit_price: 250,
          },
        ],
      },
      actor,
    );

    expect(result.status).toBe('completed');
    expect(result.items.length).toBe(1);
    expect(result.items[0].quantity_dispensed).toBe(6);

    // Verify batch quantity was deducted
    const updatedBatch = inventoryStore
      .getBatchesForMedicine('med-002')
      .find((b) => b.id === 'bat-003-kohat')!;
    expect(updatedBatch.quantity_on_hand).toBe(initialQty - 6);

    // Verify append-only stock movement was logged
    const movements = inventoryStore.getStockMovements({ batch_id: 'bat-003-kohat' });
    const latestMov = movements.movements[0];
    expect(latestMov.movement_type).toBe('dispensing');
    expect(latestMov.quantity).toBe(-6);
    expect(latestMov.previous_balance).toBe(initialQty);
    expect(latestMov.new_balance).toBe(initialQty - 6);

    // Verify prescription item status
    const rx = prescriptionStore.getById('rx-001-kohat')!;
    const rxItem = rx.items.find((it) => it.id === 'rxi-001-01')!;
    expect(rxItem.dispensed_quantity).toBe(6);
    expect(rxItem.status).toBe('fully_dispensed');
  });

  it('supports partial dispensing and subsequent repeat dispensing', () => {
    // 1. Partial dispensing: dispense 2 out of 6
    const disp1 = dispensingStore.dispensePrescription(
      {
        prescription_id: 'rx-001-kohat',
        idempotency_key: 'idemp-disp-part-1',
        items: [
          {
            prescription_item_id: 'rxi-001-01',
            medicine_batch_id: 'bat-003-kohat',
            dispensed_medicine_id: 'med-002',
            quantity: 2,
            unit_price: 250,
          },
        ],
      },
      actor,
    );

    expect(disp1.status).toBe('completed');

    let rx = prescriptionStore.getById('rx-001-kohat')!;
    let rxItem = rx.items.find((it) => it.id === 'rxi-001-01')!;
    expect(rxItem.dispensed_quantity).toBe(2);
    expect(rxItem.status).toBe('partially_dispensed');
    expect(rx.status).toBe('partially_dispensed');

    // 2. Repeat dispensing: dispense remaining 4
    const disp2 = dispensingStore.dispensePrescription(
      {
        prescription_id: 'rx-001-kohat',
        idempotency_key: 'idemp-disp-part-2',
        items: [
          {
            prescription_item_id: 'rxi-001-01',
            medicine_batch_id: 'bat-003-kohat',
            dispensed_medicine_id: 'med-002',
            quantity: 4,
            unit_price: 250,
          },
        ],
      },
      actor,
    );

    expect(disp2.status).toBe('completed');

    rx = prescriptionStore.getById('rx-001-kohat')!;
    rxItem = rx.items.find((it) => it.id === 'rxi-001-01')!;
    expect(rxItem.dispensed_quantity).toBe(6);
    expect(rxItem.status).toBe('fully_dispensed');
  });

  it('strictly prohibits over-dispensing beyond prescribed quantity', () => {
    // rxi-001-01 prescribed 6. Attempting to dispense 7 must fail.
    expect(() =>
      dispensingStore.dispensePrescription(
        {
          prescription_id: 'rx-001-kohat',
          idempotency_key: 'idemp-over-disp',
          items: [
            {
              prescription_item_id: 'rxi-001-01',
              medicine_batch_id: 'bat-003-kohat',
              dispensed_medicine_id: 'med-002',
              quantity: 7,
              unit_price: 250,
            },
          ],
        },
        actor,
      ),
    ).toThrow(/Over-dispensing prohibited/i);
  });

  it('strictly rejects dispensing with insufficient stock and prevents negative stock', () => {
    // bat-007-kohat has Omeprazole 20mg. Set its quantity_on_hand to 3.
    // rxi-001-02 has prescribed_quantity 14.
    // Requesting quantity 10 is authorized by prescription (10 <= 14), but exceeds batch stock (10 > 3).
    const batch = inventoryStore
      .getBatchesForMedicine('med-005')
      .find((b) => b.id === 'bat-007-kohat')!;
    batch.quantity_on_hand = 3;

    expect(() =>
      dispensingStore.dispensePrescription(
        {
          prescription_id: 'rx-001-kohat',
          idempotency_key: 'idemp-insufficient-stock',
          items: [
            {
              prescription_item_id: 'rxi-001-02',
              medicine_batch_id: 'bat-007-kohat',
              dispensed_medicine_id: 'med-005',
              quantity: 10, // Exceeds on-hand 3
              unit_price: 14,
            },
          ],
        },
        actor,
      ),
    ).toThrow(/Insufficient stock in batch/i);
  });

  it('strictly rejects dispensing from expired batches', () => {
    // bat-002-kohat has expired status and expiry 2026-10-10
    expect(() =>
      dispensingStore.dispensePrescription(
        {
          prescription_id: 'rx-001-kohat',
          idempotency_key: 'idemp-expired-batch',
          items: [
            {
              prescription_item_id: 'rxi-001-01',
              medicine_batch_id: 'bat-002-kohat',
              dispensed_medicine_id: 'med-002',
              quantity: 2,
              unit_price: 240,
            },
          ],
        },
        actor,
      ),
    ).toThrow(/expired/i);
  });

  it('strictly rejects dispensing from quarantined batches', () => {
    // bat-008-kohat has status 'quarantined'
    expect(() =>
      dispensingStore.dispensePrescription(
        {
          prescription_id: 'rx-001-kohat',
          idempotency_key: 'idemp-quarantined-batch',
          items: [
            {
              prescription_item_id: 'rxi-001-02',
              medicine_batch_id: 'bat-008-kohat',
              dispensed_medicine_id: 'med-005',
              quantity: 2,
              unit_price: 14,
            },
          ],
        },
        actor,
      ),
    ).toThrow(/quarantined/i);
  });

  it('atomic rollback: if any item fails in a multi-item dispensing, prior items roll back cleanly', () => {
    const initialBatch1 = inventoryStore
      .getBatchesForMedicine('med-002')
      .find((b) => b.id === 'bat-003-kohat')!;
    const initialQty1 = initialBatch1.quantity_on_hand;

    // Set batch 2 stock to 2 units.
    const batch2 = inventoryStore
      .getBatchesForMedicine('med-005')
      .find((b) => b.id === 'bat-007-kohat')!;
    batch2.quantity_on_hand = 2;

    // Item 1 is valid (qty 2). Item 2 is invalid (qty 10 exceeds on-hand 2).
    expect(() =>
      dispensingStore.dispensePrescription(
        {
          prescription_id: 'rx-001-kohat',
          idempotency_key: 'idemp-multi-fail',
          items: [
            {
              prescription_item_id: 'rxi-001-01',
              medicine_batch_id: 'bat-003-kohat',
              dispensed_medicine_id: 'med-002',
              quantity: 2,
              unit_price: 250,
            },
            {
              prescription_item_id: 'rxi-001-02',
              medicine_batch_id: 'bat-007-kohat',
              dispensed_medicine_id: 'med-005',
              quantity: 10, // Fails due to insufficient batch stock (10 > 2)
              unit_price: 14,
            },
          ],
        },
        actor,
      ),
    ).toThrow(/Insufficient stock in batch/i);

    // Verify Item 1 stock was NOT deducted (atomic rollback)
    const afterBatch1 = inventoryStore
      .getBatchesForMedicine('med-002')
      .find((b) => b.id === 'bat-003-kohat')!;
    expect(afterBatch1.quantity_on_hand).toBe(initialQty1);

    // Verify prescription was NOT modified
    const rx = prescriptionStore.getById('rx-001-kohat')!;
    const rxItem1 = rx.items.find((it) => it.id === 'rxi-001-01')!;
    expect(rxItem1.dispensed_quantity).toBe(0);
    expect(rx.status).toBe('pending');
  });

  it('prevents duplicate submissions using idempotency key', () => {
    const payload = {
      prescription_id: 'rx-001-kohat',
      idempotency_key: 'idemp-dup-test-01',
      items: [
        {
          prescription_item_id: 'rxi-001-01',
          medicine_batch_id: 'bat-003-kohat',
          dispensed_medicine_id: 'med-002',
          quantity: 2,
          unit_price: 250,
        },
      ],
    };

    // First attempt succeeds
    const first = dispensingStore.dispensePrescription(payload, actor);
    expect(first.status).toBe('completed');

    // Duplicate attempt fails
    expect(() => dispensingStore.dispensePrescription(payload, actor)).toThrow(
      /Duplicate dispensing transaction detected/i,
    );
  });

  it('reverses dispensing with compensating stock movements and prevents double-reversal', () => {
    // 1. Dispense Ceftriaxone (qty: 3)
    const disp = dispensingStore.dispensePrescription(
      {
        prescription_id: 'rx-001-kohat',
        idempotency_key: 'idemp-reversal-test',
        items: [
          {
            prescription_item_id: 'rxi-001-01',
            medicine_batch_id: 'bat-003-kohat',
            dispensed_medicine_id: 'med-002',
            quantity: 3,
            unit_price: 250,
          },
        ],
      },
      actor,
    );

    const batchAfterDisp = inventoryStore
      .getBatchesForMedicine('med-002')
      .find((b) => b.id === 'bat-003-kohat')!;
    const qtyAfterDisp = batchAfterDisp.quantity_on_hand;

    // 2. Reverse dispensing
    const reversed = dispensingStore.reverseDispensing(
      {
        dispensing_record_id: disp.id,
        reason: 'Patient experienced adverse drug reaction prior to injection administration.',
      },
      actor,
    );

    expect(reversed.status).toBe('reversed');
    expect(reversed.deleted_at).toBeDefined();

    // 3. Verify stock was restored
    const batchAfterRev = inventoryStore
      .getBatchesForMedicine('med-002')
      .find((b) => b.id === 'bat-003-kohat')!;
    expect(batchAfterRev.quantity_on_hand).toBe(qtyAfterDisp + 3);

    // 4. Verify compensating movement was logged
    const movements = inventoryStore.getStockMovements({ batch_id: 'bat-003-kohat' });
    const latestMov = movements.movements[0];
    expect(latestMov.movement_type).toBe('adjustment');
    expect(latestMov.quantity).toBe(3);
    expect(latestMov.reference_type).toBe('manual_correction');
    expect(latestMov.reason).toContain('Compensating reversal');

    // 5. Verify prescription counters rolled back to pending
    const rx = prescriptionStore.getById('rx-001-kohat')!;
    const rxItem = rx.items.find((it) => it.id === 'rxi-001-01')!;
    expect(rxItem.dispensed_quantity).toBe(0);
    expect(rxItem.status).toBe('pending');
    expect(rx.status).toBe('pending');

    // 6. Attempting to reverse again throws double-reversal error
    expect(() =>
      dispensingStore.reverseDispensing(
        {
          dispensing_record_id: disp.id,
          reason: 'Duplicate reversal attempt',
        },
        actor,
      ),
    ).toThrow(/already been reversed/i);
  });
});
