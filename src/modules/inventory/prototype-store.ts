import {
  MedicineBatch,
  StockMovement,
  BatchStatus,
  BatchFilters,
  MovementFilters,
  StockAdjustmentInput,
  CreateOpeningBatchInput,
  ReceiveGoodsBatchInput,
  DispenseBatchStockInput,
  ReverseDispensedStockInput,
  InventoryOverviewSummary,
  InventoryAlert,
} from './types';
import { medicineStore } from '@/modules/medicines/prototype-store';
import { generateInventoryAlerts, DEFAULT_ALERT_THRESHOLDS } from './alerts';

export const initialBatches: MedicineBatch[] = [
  {
    id: 'bat-001-kohat',
    medicine_id: 'med-001',
    batch_number: 'AMX-2026-01',
    expiry_date: '2027-05-15',
    quantity_on_hand: 200,
    quantity_received: 200,
    unit_cost: 18.5,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-002-kohat',
    medicine_id: 'med-002',
    batch_number: 'B-2026-047',
    expiry_date: '2026-10-10', // Expired
    quantity_on_hand: 15,
    quantity_received: 50,
    unit_cost: 240.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'expired',
    created_at: '2026-08-10T08:00:00.000Z',
    updated_at: '2026-10-11T09:00:00.000Z',
  },
  {
    id: 'bat-003-kohat',
    medicine_id: 'med-002',
    batch_number: 'CTX-2026-08',
    expiry_date: '2027-08-20',
    quantity_on_hand: 150,
    quantity_received: 150,
    unit_cost: 250.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-09-15T08:00:00.000Z',
    updated_at: '2026-09-15T08:00:00.000Z',
  },
  {
    id: 'bat-004-kohat',
    medicine_id: 'med-003',
    batch_number: 'B-2026-031',
    expiry_date: '2026-11-27', // Expiring in ~45 days
    quantity_on_hand: 120,
    quantity_received: 300,
    unit_cost: 4.2,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-07-20T08:00:00.000Z',
    updated_at: '2026-07-20T08:00:00.000Z',
  },
  {
    id: 'bat-005-kohat',
    medicine_id: 'med-003',
    batch_number: 'MET-2026-04',
    expiry_date: '2027-10-15',
    quantity_on_hand: 500,
    quantity_received: 500,
    unit_cost: 4.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-05T08:00:00.000Z',
    updated_at: '2026-10-05T08:00:00.000Z',
  },
  {
    id: 'bat-006-kohat',
    medicine_id: 'med-004',
    batch_number: 'PCM-2026-11',
    expiry_date: '2027-12-01',
    quantity_on_hand: 1500,
    quantity_received: 1500,
    unit_cost: 2.5,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'bat-007-kohat',
    medicine_id: 'med-005',
    batch_number: 'OMP-2026-09',
    expiry_date: '2027-04-10',
    quantity_on_hand: 350,
    quantity_received: 400,
    unit_cost: 12.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-08-25T08:00:00.000Z',
    updated_at: '2026-08-25T08:00:00.000Z',
  },
  {
    id: 'bat-008-kohat',
    medicine_id: 'med-005',
    batch_number: 'B-2026-099Q',
    expiry_date: '2027-02-15',
    quantity_on_hand: 20,
    quantity_received: 20,
    unit_cost: 12.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'quarantined', // Suspected seal breach
    created_at: '2026-09-10T08:00:00.000Z',
    updated_at: '2026-10-10T11:00:00.000Z',
  },
  {
    id: 'bat-009-kohat',
    medicine_id: 'med-006',
    batch_number: 'AML-2026-02',
    expiry_date: '2027-06-30',
    quantity_on_hand: 400,
    quantity_received: 400,
    unit_cost: 5.5,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-09-20T08:00:00.000Z',
    updated_at: '2026-09-20T08:00:00.000Z',
  },
  {
    id: 'bat-010-kohat',
    medicine_id: 'med-008',
    batch_number: 'CIP-2026-03',
    expiry_date: '2027-03-15',
    quantity_on_hand: 25, // Below min_threshold 30
    quantity_received: 100,
    unit_cost: 14.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-08-01T08:00:00.000Z',
    updated_at: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'bat-011-kohat',
    medicine_id: 'med-009',
    batch_number: 'IBU-2026-07',
    expiry_date: '2027-09-01',
    quantity_on_hand: 100,
    quantity_received: 100,
    unit_cost: 6.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-09-28T08:00:00.000Z',
    updated_at: '2026-09-28T08:00:00.000Z',
  },
  {
    id: 'bat-183-kohat',
    medicine_id: 'med-183',
    batch_number: 'GNM-2026-01',
    expiry_date: '2027-11-20',
    quantity_on_hand: 250,
    quantity_received: 250,
    unit_cost: 330.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-134-kohat',
    medicine_id: 'med-134',
    batch_number: 'PRV-2026-09',
    expiry_date: '2027-08-15',
    quantity_on_hand: 200,
    quantity_received: 200,
    unit_cost: 225.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-135-kohat',
    medicine_id: 'med-135',
    batch_number: 'RL-2026-04',
    expiry_date: '2028-01-10',
    quantity_on_hand: 350,
    quantity_received: 350,
    unit_cost: 128.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-1300-kohat',
    medicine_id: 'med-1300',
    batch_number: 'RPD-2026-02',
    expiry_date: '2027-10-05',
    quantity_on_hand: 180,
    quantity_received: 180,
    unit_cost: 450.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-914-kohat',
    medicine_id: 'med-914',
    batch_number: 'ZCF-2026-11',
    expiry_date: '2027-07-25',
    quantity_on_hand: 220,
    quantity_received: 220,
    unit_cost: 228.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-3021-kohat',
    medicine_id: 'med-3021',
    batch_number: 'DBC-2026-08',
    expiry_date: '2027-12-15',
    quantity_on_hand: 160,
    quantity_received: 160,
    unit_cost: 561.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-150-kohat',
    medicine_id: 'med-150',
    batch_number: 'NS-2026-100',
    expiry_date: '2028-03-20',
    quantity_on_hand: 400,
    quantity_received: 400,
    unit_cost: 86.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-454-kohat',
    medicine_id: 'med-454',
    batch_number: 'DRP-2026-01',
    expiry_date: '2029-01-01',
    quantity_on_hand: 500,
    quantity_received: 500,
    unit_cost: 100.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-031-kohat',
    medicine_id: 'med-031',
    batch_number: 'SYR-10CC-05',
    expiry_date: '2029-06-01',
    quantity_on_hand: 1000,
    quantity_received: 1000,
    unit_cost: 60.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-019-kohat',
    medicine_id: 'med-019',
    batch_number: 'SYR-5CC-03',
    expiry_date: '2029-06-01',
    quantity_on_hand: 1200,
    quantity_received: 1200,
    unit_cost: 30.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-033-kohat',
    medicine_id: 'med-033',
    batch_number: 'CAN-2026-22G',
    expiry_date: '2028-12-31',
    quantity_on_hand: 300,
    quantity_received: 300,
    unit_cost: 350.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bat-002-stick-kohat',
    medicine_id: 'med-002-stick',
    batch_number: 'STK-2026-01',
    expiry_date: '2029-12-31',
    quantity_on_hand: 200,
    quantity_received: 200,
    unit_cost: 150.0,
    supplier_id: null,
    goods_receipt_item_id: null,
    status: 'available',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
];

export const initialStockMovements: StockMovement[] = [
  {
    id: 'mov-001',
    medicine_batch_id: 'bat-001-kohat',
    movement_type: 'receipt',
    quantity: 200,
    reference_type: 'opening_balance',
    reference_id: 'init-001',
    reason: 'Initial physical inventory opening balance verified by central pharmacy staff.',
    performed_by: 'usr-admin-001',
    performed_by_name: 'Dr. Tariq Khan (Pharmacist)',
    performed_at: '2026-10-01T08:00:00.000Z',
    batch_number: 'AMX-2026-01',
    medicine_id: 'med-001',
    medicine_name: 'Amoxicillin 500mg',
    strength: '500mg',
    dosage_form: 'Capsule',
    previous_balance: 0,
    new_balance: 200,
  },
  {
    id: 'mov-002',
    medicine_batch_id: 'bat-002-kohat',
    movement_type: 'adjustment',
    quantity: -15,
    reference_type: 'expired_write_off',
    reference_id: 'adj-2026-0089',
    reason: 'Batch B-2026-047 reached expiration date 2026-10-10. Quarantined for disposal.',
    performed_by: 'usr-admin-001',
    performed_by_name: 'Dr. Tariq Khan (Pharmacist)',
    performed_at: '2026-10-11T09:00:00.000Z',
    batch_number: 'B-2026-047',
    medicine_id: 'med-002',
    medicine_name: 'Ceftriaxone 1g',
    strength: '1g',
    dosage_form: 'Vial',
    previous_balance: 15,
    new_balance: 0,
  },
  {
    id: 'mov-003',
    medicine_batch_id: 'bat-008-kohat',
    movement_type: 'adjustment',
    quantity: -20,
    reference_type: 'quarantine',
    reference_id: 'adj-2026-0091',
    reason: 'Foil seal integrity compromised during handling in warehouse.',
    performed_by: 'usr-admin-001',
    performed_by_name: 'Dr. Tariq Khan (Pharmacist)',
    performed_at: '2026-10-10T11:00:00.000Z',
    batch_number: 'B-2026-099Q',
    medicine_id: 'med-005',
    medicine_name: 'Omeprazole 20mg',
    strength: '20mg',
    dosage_form: 'Capsule',
    previous_balance: 20,
    new_balance: 0,
  },
];

class InventoryPrototypeStore {
  private batches: MedicineBatch[] = [...initialBatches];
  private movements: StockMovement[] = [...initialStockMovements];
  private processedIdempotencyKeys = new Set<string>();

  public getBatchesForMedicine(medicineId: string): MedicineBatch[] {
    return this.batches.filter((b) => b.medicine_id === medicineId);
  }

  public getBatches(filters: BatchFilters = {}): {
    batches: (MedicineBatch & {
      medicine_name?: string;
      strength?: string;
      dosage_form?: string;
    })[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  } {
    const { search, medicine_id, status = 'all', expiry_window = 'all' } = filters;
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, Math.min(100, filters.pageSize || 10));

    const medicines = medicineStore.getAllRawMedicines();
    const medMap = new Map(medicines.map((m) => [m.id, m]));

    let list = this.batches.map((b) => {
      const med = medMap.get(b.medicine_id);
      return {
        ...b,
        medicine: med,
        medicine_name: med ? med.name : 'Unknown Medicine',
        strength: med ? med.strength : '',
        dosage_form: med ? med.dosage_form : '',
      };
    });

    if (medicine_id) {
      list = list.filter((b) => b.medicine_id === medicine_id);
    }

    if (status !== 'all') {
      list = list.filter((b) => b.status === status);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const future60Days = new Date();
    future60Days.setDate(future60Days.getDate() + 60);
    const future60Str = future60Days.toISOString().slice(0, 10);

    if (expiry_window === 'expired') {
      list = list.filter((b) => b.expiry_date < todayStr);
    } else if (expiry_window === 'near_expiry') {
      list = list.filter((b) => b.expiry_date >= todayStr && b.expiry_date <= future60Str);
    } else if (expiry_window === 'valid') {
      list = list.filter((b) => b.expiry_date > future60Str);
    }

    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.batch_number.toLowerCase().includes(term) ||
          b.medicine_name.toLowerCase().includes(term) ||
          b.strength.toLowerCase().includes(term),
      );
    }

    // Sort by expiry date ascending (FEFO)
    list.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

    const totalRecords = list.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;

    return {
      batches: list.slice(startIndex, startIndex + pageSize),
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize,
    };
  }

  public getBatchById(id: string): MedicineBatch | null {
    const b = this.batches.find((item) => item.id === id);
    if (!b) return null;
    const med = medicineStore.getAllRawMedicines().find((m) => m.id === b.medicine_id);
    return { ...b, medicine: med };
  }

  public getStockMovements(filters: MovementFilters = {}): {
    movements: StockMovement[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  } {
    const {
      search,
      medicine_id,
      batch_id,
      movement_type = 'all',
      reference_type = 'all',
    } = filters;
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, Math.min(100, filters.pageSize || 15));

    let list = [...this.movements];

    if (medicine_id) {
      list = list.filter((m) => m.medicine_id === medicine_id);
    }

    if (batch_id) {
      list = list.filter((m) => m.medicine_batch_id === batch_id);
    }

    if (movement_type !== 'all') {
      list = list.filter((m) => m.movement_type === movement_type);
    }

    if (reference_type !== 'all') {
      list = list.filter((m) => m.reference_type === reference_type);
    }

    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          (m.batch_number && m.batch_number.toLowerCase().includes(term)) ||
          (m.medicine_name && m.medicine_name.toLowerCase().includes(term)) ||
          (m.reason && m.reason.toLowerCase().includes(term)) ||
          (m.reference_id && m.reference_id.toLowerCase().includes(term)),
      );
    }

    // Sort descending by timestamp
    list.sort((a, b) => b.performed_at.localeCompare(a.performed_at));

    const totalRecords = list.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;

    return {
      movements: list.slice(startIndex, startIndex + pageSize),
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize,
    };
  }

  public createOpeningBatch(
    input: CreateOpeningBatchInput,
    actor: { id: string; name: string },
  ): MedicineBatch {
    const med = medicineStore.getAllRawMedicines().find((m) => m.id === input.medicine_id);
    if (!med) {
      throw new Error(`Invalid medicine ID: ${input.medicine_id}`);
    }

    const normalizedBatch = input.batch_number.trim().toUpperCase();

    // Check duplicate (medicine_id, batch_number)
    const exists = this.batches.find(
      (b) => b.medicine_id === input.medicine_id && b.batch_number === normalizedBatch,
    );
    if (exists) {
      throw new Error(
        `Batch "${normalizedBatch}" already exists for medicine "${med.name}". Batches must have unique lot numbers.`,
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const isExpired = input.expiry_date < todayStr;
    const status: BatchStatus = isExpired ? 'expired' : 'available';

    const now = new Date().toISOString();
    const batchId = `bat-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    const newBatch: MedicineBatch = {
      id: batchId,
      medicine_id: med.id,
      batch_number: normalizedBatch,
      expiry_date: input.expiry_date,
      quantity_on_hand: input.quantity,
      quantity_received: input.quantity,
      unit_cost: input.unit_cost,
      supplier_id: null,
      goods_receipt_item_id: null,
      status,
      created_at: now,
      updated_at: now,
      medicine: med,
    };

    this.batches.unshift(newBatch);

    // Record immutable opening balance stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      medicine_batch_id: batchId,
      movement_type: 'receipt',
      quantity: input.quantity,
      reference_type: 'opening_balance',
      reference_id: `OPN-${batchId}`,
      reason: input.notes
        ? `Opening balance intake: ${input.notes}`
        : 'Opening stock balance recorded during inventory physical take.',
      performed_by: actor.id,
      performed_by_name: actor.name,
      performed_at: now,
      batch_number: normalizedBatch,
      medicine_id: med.id,
      medicine_name: med.name,
      strength: med.strength,
      dosage_form: med.dosage_form,
      previous_balance: 0,
      new_balance: input.quantity,
    };

    this.movements.unshift(movement);

    return newBatch;
  }

  public receiveGoodsBatch(
    input: ReceiveGoodsBatchInput,
    actor: { id: string; name: string },
  ): { batch: MedicineBatch; movement: StockMovement } {
    // 1. Idempotency Check
    if (this.processedIdempotencyKeys.has(input.idempotency_key)) {
      throw new Error(
        'Duplicate goods receiving transaction detected. This batch intake has already been recorded.',
      );
    }

    if (input.quantity_accepted <= 0) {
      throw new Error('Accepted quantity must be greater than zero to receive into inventory.');
    }

    // 2. Locate medicine
    const med = medicineStore.getAllRawMedicines().find((m) => m.id === input.medicine_id);
    if (!med) {
      throw new Error(`Invalid medicine ID: ${input.medicine_id}`);
    }

    const normalizedBatch = input.batch_number.trim().toUpperCase();
    const todayStr = new Date().toISOString().slice(0, 10);
    if (input.expiry_date <= todayStr) {
      throw new Error(
        `Cannot receive expired batch "${normalizedBatch}" (expiry: ${input.expiry_date}). Expired stock is prohibited from receiving.`,
      );
    }

    const now = new Date().toISOString();

    // 3. Check existing batch
    const existingIndex = this.batches.findIndex(
      (b) => b.medicine_id === input.medicine_id && b.batch_number === normalizedBatch,
    );

    let updatedBatch: MedicineBatch;
    let prevQty = 0;
    let newQty = 0;

    if (existingIndex !== -1) {
      const existing = this.batches[existingIndex];
      // Do not silently merge batches with different expiry dates!
      if (existing.expiry_date !== input.expiry_date) {
        throw new Error(
          `Batch "${normalizedBatch}" already exists with expiry ${existing.expiry_date}. Cannot silently merge with delivery expiry ${input.expiry_date}. Separate lot numbers are required.`,
        );
      }
      prevQty = existing.quantity_on_hand;
      newQty = prevQty + input.quantity_accepted;
      updatedBatch = {
        ...existing,
        quantity_on_hand: newQty,
        quantity_received: existing.quantity_received + input.quantity_accepted,
        unit_cost: input.unit_cost,
        status: 'available',
        updated_at: now,
        medicine: med,
      };
      this.batches[existingIndex] = updatedBatch;
    } else {
      prevQty = 0;
      newQty = input.quantity_accepted;
      const batchId = `bat-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
      updatedBatch = {
        id: batchId,
        medicine_id: med.id,
        batch_number: normalizedBatch,
        expiry_date: input.expiry_date,
        quantity_on_hand: newQty,
        quantity_received: newQty,
        unit_cost: input.unit_cost,
        supplier_id: input.supplier_id,
        goods_receipt_item_id: input.goods_receipt_item_id || null,
        status: 'available',
        created_at: now,
        updated_at: now,
        medicine: med,
      };
      this.batches.unshift(updatedBatch);
    }

    // 4. Record append-only stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      medicine_batch_id: updatedBatch.id,
      movement_type: 'receipt',
      quantity: input.quantity_accepted,
      reference_type: 'goods_receipt',
      reference_id: input.grn_number,
      reason: input.notes
        ? `Goods received against GRN ${input.grn_number}: ${input.notes}`
        : `Goods received against GRN ${input.grn_number}.`,
      performed_by: actor.id,
      performed_by_name: actor.name,
      performed_at: now,
      batch_number: normalizedBatch,
      medicine_id: med.id,
      medicine_name: med.name,
      strength: med.strength,
      dosage_form: med.dosage_form,
      previous_balance: prevQty,
      new_balance: newQty,
    };
    this.movements.unshift(movement);

    // 5. Save idempotency key
    this.processedIdempotencyKeys.add(input.idempotency_key);

    return { batch: updatedBatch, movement };
  }

  public recordStockAdjustment(
    input: StockAdjustmentInput,
    actor: { id: string; name: string },
  ): { batch: MedicineBatch; movement: StockMovement } {
    // 1. Idempotency Check
    if (this.processedIdempotencyKeys.has(input.idempotency_key)) {
      throw new Error(
        'Duplicate adjustment request detected. This operation has already been processed.',
      );
    }

    // 2. Locate Batch
    const batchIndex = this.batches.findIndex((b) => b.id === input.batch_id);
    if (batchIndex === -1) {
      throw new Error(`Batch not found: ${input.batch_id}`);
    }

    const currentBatch = this.batches[batchIndex];
    const med = medicineStore.getAllRawMedicines().find((m) => m.id === currentBatch.medicine_id);
    const medName = med ? med.name : 'Unknown Medicine';

    // 3. Prevent operations on depleted or illegal status
    if (currentBatch.status === 'depleted' && input.adjustment_type !== 'increase') {
      throw new Error(`Batch ${currentBatch.batch_number} is already depleted.`);
    }

    const prevQty = currentBatch.quantity_on_hand;
    let newQty = prevQty;
    let signedMovementQty = 0;
    let movementType: StockMovement['movement_type'] = 'adjustment';
    let referenceType: StockMovement['reference_type'] = 'inventory_adjustment';
    let newStatus: BatchStatus = currentBatch.status;

    if (input.adjustment_type === 'increase') {
      newQty = prevQty + input.quantity;
      signedMovementQty = input.quantity;
      if (newStatus === 'depleted' && newQty > 0) {
        newStatus = 'available';
      }
    } else if (input.adjustment_type === 'decrease') {
      if (input.quantity > prevQty) {
        throw new Error(
          `Cannot deduct ${input.quantity} units from batch ${currentBatch.batch_number}. Current balance is ${prevQty} units. Negative stock is prohibited.`,
        );
      }
      newQty = prevQty - input.quantity;
      signedMovementQty = -input.quantity;
      if (newQty === 0) {
        newStatus = 'depleted';
      }
    } else if (input.adjustment_type === 'write_off') {
      if (input.quantity > prevQty) {
        throw new Error(
          `Cannot write off ${input.quantity} units from batch ${currentBatch.batch_number}. Current balance is ${prevQty} units.`,
        );
      }
      newQty = prevQty - input.quantity;
      signedMovementQty = -input.quantity;
      movementType = 'expired_write_off';
      referenceType = 'expired_write_off';
      if (newQty === 0) {
        newStatus = 'depleted';
      }
    } else if (input.adjustment_type === 'quarantine') {
      if (input.quantity > prevQty) {
        throw new Error(
          `Cannot quarantine ${input.quantity} units from batch ${currentBatch.batch_number}. Current balance is ${prevQty} units.`,
        );
      }
      // If entire remaining batch is quarantined:
      newStatus = 'quarantined';
      referenceType = 'quarantine';
      signedMovementQty = 0; // Quarantine isolates the batch without destroying ledger count
    }

    const now = new Date().toISOString();

    // 4. Atomic In-Memory Update
    const updatedBatch: MedicineBatch = {
      ...currentBatch,
      quantity_on_hand: newQty,
      status: newStatus,
      updated_at: now,
      medicine: med,
    };
    this.batches[batchIndex] = updatedBatch;

    // 5. Append Immutable Movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      medicine_batch_id: currentBatch.id,
      movement_type: movementType,
      quantity: signedMovementQty,
      reference_type: referenceType,
      reference_id: `ADJ-${input.idempotency_key.slice(0, 12)}`,
      reason: `[${input.reason.toUpperCase()}] ${input.notes}`,
      performed_by: actor.id,
      performed_by_name: actor.name,
      performed_at: now,
      batch_number: currentBatch.batch_number,
      medicine_id: currentBatch.medicine_id,
      medicine_name: medName,
      strength: med?.strength,
      dosage_form: med?.dosage_form,
      previous_balance: prevQty,
      new_balance: newQty,
    };
    this.movements.unshift(movement);

    // 6. Record Idempotency Key
    this.processedIdempotencyKeys.add(input.idempotency_key);

    return { batch: updatedBatch, movement };
  }

  public quarantineBatch(
    batchId: string,
    reasonText: string,
    actor: { id: string; name: string },
  ): MedicineBatch {
    const batchIndex = this.batches.findIndex((b) => b.id === batchId);
    if (batchIndex === -1) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    const currentBatch = this.batches[batchIndex];
    const med = medicineStore.getAllRawMedicines().find((m) => m.id === currentBatch.medicine_id);
    const now = new Date().toISOString();

    const updatedBatch: MedicineBatch = {
      ...currentBatch,
      status: 'quarantined',
      updated_at: now,
      medicine: med,
    };
    this.batches[batchIndex] = updatedBatch;

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      medicine_batch_id: currentBatch.id,
      movement_type: 'adjustment',
      quantity: 0,
      reference_type: 'quarantine',
      reference_id: `QRN-${currentBatch.id}`,
      reason: `Batch quarantined: ${reasonText}`,
      performed_by: actor.id,
      performed_by_name: actor.name,
      performed_at: now,
      batch_number: currentBatch.batch_number,
      medicine_id: currentBatch.medicine_id,
      medicine_name: med?.name,
      strength: med?.strength,
      dosage_form: med?.dosage_form,
      previous_balance: currentBatch.quantity_on_hand,
      new_balance: currentBatch.quantity_on_hand,
    };
    this.movements.unshift(movement);

    return updatedBatch;
  }

  public getInventoryOverview(): InventoryOverviewSummary {
    const medicines = medicineStore.getAllRawMedicines().filter((m) => !m.deleted_at);
    const activeMeds = medicines.filter((m) => m.is_active);

    const totalMedicines = activeMeds.length;
    const totalBatches = this.batches.length;

    let totalUnits = 0;
    let availableUnits = 0;
    let quarantinedUnits = 0;
    let expiredUnits = 0;
    let estimatedStockValue = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const future60Days = new Date();
    future60Days.setDate(future60Days.getDate() + 60);
    const future60Str = future60Days.toISOString().slice(0, 10);

    let nearExpiryBatchesCount = 0;
    let expiredBatchesCount = 0;

    this.batches.forEach((b) => {
      totalUnits += b.quantity_on_hand;
      estimatedStockValue += b.quantity_on_hand * b.unit_cost;

      if (b.status === 'available') {
        availableUnits += b.quantity_on_hand;
      } else if (b.status === 'quarantined') {
        quarantinedUnits += b.quantity_on_hand;
      } else if (b.status === 'expired') {
        expiredUnits += b.quantity_on_hand;
      }

      if (b.quantity_on_hand > 0) {
        if (b.expiry_date < todayStr || b.status === 'expired') {
          expiredBatchesCount++;
        } else if (b.expiry_date <= future60Str) {
          nearExpiryBatchesCount++;
        }
      }
    });

    // Compute medicine-level low stock & stockout counts
    let lowStockCount = 0;
    let outOfStockCount = 0;

    activeMeds.forEach((med) => {
      const medBatches = this.batches.filter((b) => b.medicine_id === med.id);
      const available = medBatches
        .filter((b) => b.status === 'available')
        .reduce((sum, b) => sum + b.quantity_on_hand, 0);

      if (available === 0) {
        outOfStockCount++;
      } else if (available <= med.min_threshold) {
        lowStockCount++;
      }
    });

    return {
      total_medicines: totalMedicines,
      total_batches: totalBatches,
      total_units_on_hand: totalUnits,
      available_units: availableUnits,
      quarantined_units: quarantinedUnits,
      expired_units: expiredUnits,
      low_stock_medicines_count: lowStockCount,
      out_of_stock_medicines_count: outOfStockCount,
      near_expiry_batches_count: nearExpiryBatchesCount,
      expired_batches_count: expiredBatchesCount,
      estimated_stock_value_pkr: Math.round(estimatedStockValue),
      isLiveDatabase: false,
    };
  }

  public getAlerts(): InventoryAlert[] {
    const medicines = medicineStore.getAllRawMedicines();
    return generateInventoryAlerts(medicines, this.batches, DEFAULT_ALERT_THRESHOLDS);
  }

  public dispenseBatchStock(
    input: DispenseBatchStockInput,
    actor: { id: string; name: string },
  ): { batch: MedicineBatch; movement: StockMovement } {
    // 1. Idempotency Check
    if (this.processedIdempotencyKeys.has(input.idempotency_key)) {
      throw new Error(
        `Duplicate dispensing transaction detected. Request with idempotency key ${input.idempotency_key} has already been processed.`,
      );
    }

    if (input.quantity <= 0) {
      throw new Error('Dispensed quantity must be greater than zero.');
    }

    // 2. Locate Batch
    const batchIndex = this.batches.findIndex((b) => b.id === input.batch_id);
    if (batchIndex === -1) {
      throw new Error(`Medicine batch not found: ${input.batch_id}`);
    }

    const currentBatch = this.batches[batchIndex];
    const med = medicineStore.getAllRawMedicines().find((m) => m.id === currentBatch.medicine_id);
    const medName = med ? med.name : 'Unknown Medicine';

    // 3. Batch eligibility checks
    if (currentBatch.status === 'quarantined') {
      throw new Error(`Batch ${currentBatch.batch_number} is quarantined and cannot be dispensed.`);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (currentBatch.status === 'expired' || currentBatch.expiry_date <= todayStr) {
      throw new Error(
        `Batch ${currentBatch.batch_number} has expired (${currentBatch.expiry_date}) and cannot be dispensed.`,
      );
    }

    if (currentBatch.quantity_on_hand < input.quantity) {
      throw new Error(
        `Insufficient stock in batch ${currentBatch.batch_number}: requested ${input.quantity}, available ${currentBatch.quantity_on_hand}. Negative stock is prohibited.`,
      );
    }

    // 4. Compute updated quantities
    const prevQty = currentBatch.quantity_on_hand;
    const newQty = prevQty - input.quantity;
    const newStatus: BatchStatus = newQty === 0 ? 'depleted' : currentBatch.status;
    const now = new Date().toISOString();

    const updatedBatch: MedicineBatch = {
      ...currentBatch,
      quantity_on_hand: newQty,
      status: newStatus,
      updated_at: now,
      medicine: med,
    };
    this.batches[batchIndex] = updatedBatch;

    // 5. Append append-only stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      medicine_batch_id: currentBatch.id,
      movement_type: 'dispensing',
      quantity: -input.quantity,
      reference_type: 'dispensing_item',
      reference_id: input.dispensing_item_id,
      reason:
        input.notes ||
        `Dispensed against prescription ${input.prescription_number} (Dispensing ${input.dispensing_number}).`,
      performed_by: actor.id,
      performed_by_name: actor.name,
      performed_at: now,
      batch_number: currentBatch.batch_number,
      medicine_id: currentBatch.medicine_id,
      medicine_name: medName,
      strength: med?.strength,
      dosage_form: med?.dosage_form,
      previous_balance: prevQty,
      new_balance: newQty,
    };
    this.movements.unshift(movement);

    // 6. Record idempotency key
    this.processedIdempotencyKeys.add(input.idempotency_key);

    return { batch: updatedBatch, movement };
  }

  public reverseDispensedStock(
    input: ReverseDispensedStockInput,
    actor: { id: string; name: string },
  ): { batch: MedicineBatch; movement: StockMovement } {
    const batchIndex = this.batches.findIndex((b) => b.id === input.batch_id);
    if (batchIndex === -1) {
      throw new Error(`Medicine batch not found: ${input.batch_id}`);
    }

    const currentBatch = this.batches[batchIndex];
    const med = medicineStore.getAllRawMedicines().find((m) => m.id === currentBatch.medicine_id);
    const medName = med ? med.name : 'Unknown Medicine';

    const prevQty = currentBatch.quantity_on_hand;
    const newQty = prevQty + input.quantity;
    const newStatus: BatchStatus =
      currentBatch.status === 'depleted' && newQty > 0 ? 'available' : currentBatch.status;
    const now = new Date().toISOString();

    const updatedBatch: MedicineBatch = {
      ...currentBatch,
      quantity_on_hand: newQty,
      status: newStatus,
      updated_at: now,
      medicine: med,
    };
    this.batches[batchIndex] = updatedBatch;

    // Append compensating stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      medicine_batch_id: currentBatch.id,
      movement_type: 'adjustment',
      quantity: input.quantity,
      reference_type: 'manual_correction',
      reference_id: input.dispensing_item_id,
      reason: `Compensating reversal for Dispensing ${input.dispensing_number}. Reason: ${input.reason}`,
      performed_by: actor.id,
      performed_by_name: actor.name,
      performed_at: now,
      batch_number: currentBatch.batch_number,
      medicine_id: currentBatch.medicine_id,
      medicine_name: medName,
      strength: med?.strength,
      dosage_form: med?.dosage_form,
      previous_balance: prevQty,
      new_balance: newQty,
    };
    this.movements.unshift(movement);

    return { batch: updatedBatch, movement };
  }

  public snapshot(): { batches: MedicineBatch[]; movements: StockMovement[]; keys: string[] } {
    return {
      batches: JSON.parse(JSON.stringify(this.batches)),
      movements: JSON.parse(JSON.stringify(this.movements)),
      keys: Array.from(this.processedIdempotencyKeys),
    };
  }

  public restoreSnapshot(snap: {
    batches: MedicineBatch[];
    movements: StockMovement[];
    keys: string[];
  }): void {
    this.batches = snap.batches;
    this.movements = snap.movements;
    this.processedIdempotencyKeys = new Set(snap.keys);
  }

  public resetForTesting() {
    this.batches = [...initialBatches];
    this.movements = [...initialStockMovements];
    this.processedIdempotencyKeys.clear();
  }
}

export const inventoryStore = new InventoryPrototypeStore();
