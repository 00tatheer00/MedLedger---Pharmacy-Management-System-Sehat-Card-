import { describe, it, expect, beforeEach } from 'vitest';
import { inventoryStore } from './prototype-store';
import { createOpeningBatchSchema, stockAdjustmentSchema } from './validation';
import { generateInventoryAlerts } from './alerts';
import { initialMedicinesList } from '@/modules/medicines/prototype-store';
import {
  createOpeningBatchAction,
  recordStockAdjustmentAction,
  quarantineBatchAction,
  getInventoryOverviewAction,
} from './actions';

describe('Inventory & Stock Ledger Module', () => {
  beforeEach(() => {
    inventoryStore.resetForTesting();
  });

  describe('Validation Schemas', () => {
    it('validates a correct opening batch input', () => {
      const valid = {
        medicine_id: 'med-001',
        batch_number: 'AMX-2026-99',
        expiry_date: '2027-10-15',
        quantity: 500,
        unit_cost: 17.5,
        notes: 'Initial warehouse intake',
      };

      const result = createOpeningBatchSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.batch_number).toBe('AMX-2026-99');
      }
    });

    it('rejects negative or zero batch quantity', () => {
      const invalid = {
        medicine_id: 'med-001',
        batch_number: 'AMX-2026-99',
        expiry_date: '2027-10-15',
        quantity: 0,
        unit_cost: 15,
      };

      const result = createOpeningBatchSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates authorized stock adjustment input', () => {
      const valid = {
        batch_id: 'bat-001-kohat',
        adjustment_type: 'decrease',
        quantity: 10,
        reason: 'breakage',
        notes: 'Glass packaging broken during transit in corridor',
        idempotency_key: 'adj-test-key-001',
      };

      const result = stockAdjustmentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects stock adjustment with short audit explanation', () => {
      const invalid = {
        batch_id: 'bat-001-kohat',
        adjustment_type: 'decrease',
        quantity: 10,
        reason: 'damage',
        notes: 'bad', // less than 5 characters
        idempotency_key: 'adj-test-key-002',
      };

      const result = stockAdjustmentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Batch Management & Opening Stock Intake', () => {
    it('creates opening batch and atomically logs opening stock movement', () => {
      const actor = { id: 'usr-001', name: 'Dr. Tariq' };
      const batch = inventoryStore.createOpeningBatch(
        {
          medicine_id: 'med-001',
          batch_number: 'AMX-NEW-01',
          expiry_date: '2027-11-20',
          quantity: 300,
          unit_cost: 18.0,
          notes: 'New verified batch',
        },
        actor,
      );

      expect(batch).toBeDefined();
      expect(batch.batch_number).toBe('AMX-NEW-01');
      expect(batch.quantity_on_hand).toBe(300);

      // Verify movement was created
      const movements = inventoryStore.getStockMovements({ batch_id: batch.id });
      expect(movements.totalRecords).toBe(1);
      expect(movements.movements[0].movement_type).toBe('receipt');
      expect(movements.movements[0].reference_type).toBe('opening_balance');
      expect(movements.movements[0].new_balance).toBe(300);
    });

    it('prevents duplicate batch number for the same medicine', () => {
      const actor = { id: 'usr-001', name: 'Dr. Tariq' };
      // AMX-2026-01 already exists for med-001 in seed
      expect(() => {
        inventoryStore.createOpeningBatch(
          {
            medicine_id: 'med-001',
            batch_number: 'AMX-2026-01',
            expiry_date: '2027-05-15',
            quantity: 100,
            unit_cost: 18.5,
          },
          actor,
        );
      }).toThrow(/already exists/i);
    });
  });

  describe('Strict Non-Negative Stock & Atomic Adjustments', () => {
    it('executes valid deduction and updates batch balance and ledger atomically', () => {
      const actor = { id: 'usr-001', name: 'Dr. Tariq' };
      // Initial balance of bat-001-kohat is 200
      const { batch, movement } = inventoryStore.recordStockAdjustment(
        {
          batch_id: 'bat-001-kohat',
          adjustment_type: 'decrease',
          quantity: 25,
          reason: 'damage',
          notes: 'Water damage during monsoon rain leak',
          idempotency_key: 'idem-adj-001',
        },
        actor,
      );

      expect(batch.quantity_on_hand).toBe(175);
      expect(movement.previous_balance).toBe(200);
      expect(movement.new_balance).toBe(175);
      expect(movement.quantity).toBe(-25);
    });

    it('strictly prevents deduction exceeding available stock (negative stock prohibition)', () => {
      const actor = { id: 'usr-001', name: 'Dr. Tariq' };
      // Initial balance is 200. Attempting to deduct 201 must fail.
      expect(() => {
        inventoryStore.recordStockAdjustment(
          {
            batch_id: 'bat-001-kohat',
            adjustment_type: 'decrease',
            quantity: 250,
            reason: 'count_discrepancy',
            notes: 'Physical count found fewer items',
            idempotency_key: 'idem-adj-excess',
          },
          actor,
        );
      }).toThrow(/negative stock is prohibited/i);
    });

    it('detects and prevents duplicate submissions with identical idempotency key', () => {
      const actor = { id: 'usr-001', name: 'Dr. Tariq' };
      const input = {
        batch_id: 'bat-001-kohat',
        adjustment_type: 'increase' as const,
        quantity: 5,
        reason: 'audit_reconciliation' as const,
        notes: 'Recount surplus discovered',
        idempotency_key: 'idem-duplicate-check-1',
      };

      // First run succeeds
      const first = inventoryStore.recordStockAdjustment(input, actor);
      expect(first.batch.quantity_on_hand).toBe(205);

      // Second run with same idempotency key fails
      expect(() => {
        inventoryStore.recordStockAdjustment(input, actor);
      }).toThrow(/duplicate adjustment request/i);
    });
  });

  describe('Quarantine & Surveillance Alerts', () => {
    it('quarantines a batch and updates status', () => {
      const actor = { id: 'usr-001', name: 'Dr. Tariq' };
      const batch = inventoryStore.quarantineBatch(
        'bat-003-kohat',
        'Suspicion of particulate contamination',
        actor,
      );

      expect(batch.status).toBe('quarantined');

      const movements = inventoryStore.getStockMovements({ batch_id: 'bat-003-kohat' });
      expect(movements.movements.some((m) => m.reference_type === 'quarantine')).toBe(true);
    });

    it('calculates inventory surveillance alerts with accurate severity', () => {
      const batches = inventoryStore.getBatches().batches;
      const alerts = generateInventoryAlerts(initialMedicinesList, batches, {
        defaultMinThreshold: 20,
        expiryWarningDays: 60,
        criticalExpiryDays: 30,
      });

      expect(alerts.length).toBeGreaterThan(0);

      // Out of stock alert for Insulin Glargine
      const outOfStockAlert = alerts.find((a) => a.type === 'out_of_stock');
      expect(outOfStockAlert).toBeDefined();
      expect(outOfStockAlert?.severity).toBe('critical');

      // Expired batch alert for Ceftriaxone B-2026-047
      const expiredAlert = alerts.find((a) => a.type === 'expired');
      expect(expiredAlert).toBeDefined();
      expect(expiredAlert?.batch_number).toBe('B-2026-047');
      expect(expiredAlert?.severity).toBe('critical');

      // Near expiry batch alert for Metformin B-2026-031
      const nearExpiryAlert = alerts.find((a) => a.batch_number === 'B-2026-031');
      expect(nearExpiryAlert).toBeDefined();
      expect(nearExpiryAlert?.type).toBe('near_expiry');
    });

    it('computes warehouse overview summary metrics', () => {
      const overview = inventoryStore.getInventoryOverview();
      expect(overview.total_medicines).toBeGreaterThan(0);
      expect(overview.total_units_on_hand).toBeGreaterThan(0);
      expect(overview.estimated_stock_value_pkr).toBeGreaterThan(0);
      expect(overview.expired_batches_count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Server Actions', () => {
    it('executes stock adjustment via server action', async () => {
      const res = await recordStockAdjustmentAction({
        batch_id: 'bat-001-kohat',
        adjustment_type: 'decrease',
        quantity: 5,
        reason: 'breakage',
        notes: 'Accidental drop on tiled dispensary floor',
        idempotency_key: 'action-test-key-01',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.batch.quantity_on_hand).toBe(195);
        expect(res.data.movement.performed_by_name).toBeDefined();
      }
    });

    it('creates opening batch via server action', async () => {
      const res = await createOpeningBatchAction({
        medicine_id: 'med-001',
        batch_number: 'AMX-ACTION-01',
        expiry_date: '2027-12-31',
        quantity: 150,
        unit_cost: 18.0,
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.batch_number).toBe('AMX-ACTION-01');
      }
    });

    it('quarantines batch via server action', async () => {
      const res = await quarantineBatchAction('bat-001-kohat', 'Quality control check failure');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.status).toBe('quarantined');
      }
    });

    it('fetches inventory overview via server action', async () => {
      const res = await getInventoryOverviewAction();
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.total_batches).toBeGreaterThan(0);
      }
    });
  });
});
