/**
 * MedLedger — Dispensing & Atomic Stock Transactions Prototype Store
 *
 * Implements high-fidelity, in-memory dispensing transactions with atomic multi-item
 * execution, rollback on failure, FEFO tracking, and compensating reversals.
 */

import {
  DispensingWithDetails,
  DispensingItemDetail,
  DispensePrescriptionInput,
  ReverseDispensingInput,
  DispensingFilterParams,
  PaginatedDispensingResult,
  DispensingOverviewKPIs,
} from './types';
import { prescriptionStore } from '@/modules/prescriptions/prototype-store';
import { inventoryStore } from '@/modules/inventory/prototype-store';
import { medicineStore } from '@/modules/medicines/prototype-store';
import { AdmissionPrototypeStore } from '@/modules/admissions/prototype-store';
import { PatientPrototypeStore } from '@/modules/patients/prototype-store';
import { multiplyMoney, addMoney } from '@/lib/decimal';

export const initialDispensingRecords: DispensingWithDetails[] = [
  {
    id: 'dsp-001-kohat',
    dispensing_number: 'DSP-20261011-1042',
    prescription_id: 'rx-001-kohat',
    prescription_number: 'RX-2026-0041',
    patient_id: 'pat-001-kohat',
    patient_name: 'Tariq Mehmood',
    mr_number: 'MRN-2026-00101',
    admission_id: 'adm-001-kohat',
    admission_number: 'ADM-2026-0412',
    ssp_visit_no: '37634827',
    ward: 'Male Medical Ward',
    bed_number: 'Bed 14',
    dispensed_by: 'usr-pharmacist-001',
    dispensed_by_name: 'Dr. Tariq Khan (Pharmacist)',
    dispensed_at: '2026-10-12T10:00:00.000Z',
    notes: 'Initial day dose dispensed directly to floor nurse for Bed 14.',
    status: 'completed',
    total_amount: 556.0,
    total_items: 2,
    created_at: '2026-10-12T10:00:00.000Z',
    updated_at: '2026-10-12T10:00:00.000Z',
    deleted_at: null,
    items: [
      {
        id: 'dspi-001-01',
        dispensing_record_id: 'dsp-001-kohat',
        prescription_item_id: 'rxi-001-01',
        medicine_batch_id: 'bat-003-kohat',
        dispensed_medicine_id: 'med-002',
        quantity_dispensed: 2,
        unit_price: 250.0,
        total_price: 500.0,
        created_at: '2026-10-12T10:00:00.000Z',
        prescribed_medicine_name: 'Ceftriaxone 1g',
        dispensed_medicine_name: 'Ceftriaxone 1g',
        strength: '1g',
        dosage_form: 'Vial',
        batch_number: 'CTX-2026-08',
        expiry_date: '2027-08-20',
        is_substitution: false,
        substitution_reason: null,
        is_fefo_override: false,
        fefo_override_reason: null,
      },
      {
        id: 'dspi-001-02',
        dispensing_record_id: 'dsp-001-kohat',
        prescription_item_id: 'rxi-001-02',
        medicine_batch_id: 'bat-007-kohat',
        dispensed_medicine_id: 'med-005',
        quantity_dispensed: 4,
        unit_price: 14.0,
        total_price: 56.0,
        created_at: '2026-10-12T10:00:00.000Z',
        prescribed_medicine_name: 'Omeprazole 20mg',
        dispensed_medicine_name: 'Omeprazole 20mg',
        strength: '20mg',
        dosage_form: 'Capsule',
        batch_number: 'OMP-2026-02',
        expiry_date: '2027-06-30',
        is_substitution: false,
        substitution_reason: null,
        is_fefo_override: false,
        fefo_override_reason: null,
      },
    ],
  },
];

class DispensingPrototypeStore {
  private records: DispensingWithDetails[] = [...initialDispensingRecords];
  private processedIdempotencyKeys = new Set<string>();

  public dispensePrescription(
    input: DispensePrescriptionInput,
    actor: { id: string; name: string },
  ): DispensingWithDetails {
    // 1. Idempotency Check
    if (this.processedIdempotencyKeys.has(input.idempotency_key)) {
      throw new Error(
        `Duplicate dispensing transaction detected. Request with idempotency key "${input.idempotency_key}" has already been processed.`,
      );
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('At least one medicine item must be selected for dispensing.');
    }

    // 2. Validate Prescription
    const rx = prescriptionStore.getById(input.prescription_id);
    if (!rx) {
      throw new Error(`Prescription not found: ${input.prescription_id}`);
    }

    if (rx.status === 'cancelled') {
      throw new Error(`Cannot dispense cancelled prescription ${rx.prescription_number}.`);
    }

    if (rx.status === 'fully_dispensed') {
      throw new Error(
        `Prescription ${rx.prescription_number} is already fully dispensed. No outstanding items remain.`,
      );
    }

    // 3. Take atomic snapshots for ACID rollback
    const inventorySnapshot = inventoryStore.snapshot();
    const prescriptionSnapshot = prescriptionStore.snapshot();

    try {
      // 4. Pre-validate all line items before mutating state
      for (const item of input.items) {
        if (item.quantity <= 0) {
          throw new Error('Dispensing quantity must be greater than zero.');
        }

        const rxItem = rx.items.find((it) => it.id === item.prescription_item_id);
        if (!rxItem) {
          throw new Error(
            `Prescription item ${item.prescription_item_id} not found in prescription ${rx.prescription_number}.`,
          );
        }

        const remainingAuthorized = rxItem.prescribed_quantity - rxItem.dispensed_quantity;
        if (item.quantity > remainingAuthorized) {
          throw new Error(
            `Over-dispensing prohibited on ${rxItem.medicine.name}: remaining authorized quantity is ${remainingAuthorized}, requested ${item.quantity}.`,
          );
        }

        // Verify batch exists and is eligible
        const batches = inventoryStore.getBatchesForMedicine(item.dispensed_medicine_id);
        const batch = batches.find((b) => b.id === item.medicine_batch_id);
        if (!batch) {
          throw new Error(
            `Medicine batch ${item.medicine_batch_id} not found for medicine ${item.dispensed_medicine_id}.`,
          );
        }

        if (batch.status === 'quarantined') {
          throw new Error(`Batch ${batch.batch_number} is quarantined and cannot be dispensed.`);
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        if (batch.status === 'expired' || batch.expiry_date <= todayStr) {
          throw new Error(
            `Batch ${batch.batch_number} has expired (${batch.expiry_date}) and cannot be dispensed.`,
          );
        }

        if (batch.quantity_on_hand < item.quantity) {
          throw new Error(
            `Insufficient stock in batch ${batch.batch_number}: requested ${item.quantity}, available ${batch.quantity_on_hand}. Negative stock is prohibited.`,
          );
        }
      }

      // 5. Generate unique identifiers
      const now = new Date().toISOString();
      const datePart = now.slice(0, 10).replace(/-/g, '');
      const randPart = Math.floor(Math.random() * 9000 + 1000);
      const dispensingNumber = `DSP-${datePart}-${randPart}`;
      const dispensingRecordId = `dsp-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

      // 6. Execute stock deductions atomically through inventoryStore
      const createdItems: DispensingItemDetail[] = [];
      const lineDisbursedAmounts: number[] = [];

      for (const item of input.items) {
        const rxItem = rx.items.find((it) => it.id === item.prescription_item_id)!;
        const med = medicineStore
          .getAllRawMedicines()
          .find((m) => m.id === item.dispensed_medicine_id);
        const lineTotal = multiplyMoney(item.quantity, item.unit_price);
        lineDisbursedAmounts.push(lineTotal);

        const itemId = `dspi-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

        // Deduct from shared inventory ledger
        const { batch } = inventoryStore.dispenseBatchStock(
          {
            batch_id: item.medicine_batch_id,
            quantity: item.quantity,
            dispensing_record_id: dispensingRecordId,
            dispensing_item_id: itemId,
            dispensing_number: dispensingNumber,
            prescription_number: rx.prescription_number,
            notes: item.notes,
            idempotency_key: `${input.idempotency_key}-${item.prescription_item_id}`,
          },
          actor,
        );

        createdItems.push({
          id: itemId,
          dispensing_record_id: dispensingRecordId,
          prescription_item_id: rxItem.id,
          medicine_batch_id: batch.id,
          dispensed_medicine_id: item.dispensed_medicine_id,
          quantity_dispensed: item.quantity,
          unit_price: item.unit_price,
          total_price: lineTotal,
          created_at: now,
          prescribed_medicine_name: rxItem.medicine.name,
          dispensed_medicine_name: med ? med.name : rxItem.medicine.name,
          strength: med ? med.strength : rxItem.medicine.strength,
          dosage_form: med ? med.dosage_form : rxItem.medicine.dosage_form,
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          is_substitution: Boolean(item.is_substitution),
          substitution_reason: item.substitution_reason || null,
          is_fefo_override: Boolean(item.is_fefo_override),
          fefo_override_reason: item.fefo_override_reason || null,
        });
      }

      // 7. Update Prescription counters
      const updatedRx = prescriptionStore.recordDispensedItems(
        rx.id,
        input.items.map((it) => ({
          prescriptionItemId: it.prescription_item_id,
          quantity: it.quantity,
        })),
      );

      // 8. Create Dispensing Record
      const totalAmount = addMoney(...lineDisbursedAmounts);
      const newRecord: DispensingWithDetails = {
        id: dispensingRecordId,
        dispensing_number: dispensingNumber,
        prescription_id: rx.id,
        prescription_number: rx.prescription_number,
        patient_id: rx.patient.id,
        patient_name: rx.patient.full_name,
        mr_number: rx.patient.mr_number,
        admission_id: rx.admission?.id || null,
        admission_number: rx.admission?.admission_number || null,
        ssp_visit_no: rx.admission?.ssp_visit_no || null,
        ward: rx.admission?.ward || null,
        bed_number: rx.admission?.bed_number || null,
        dispensed_by: actor.id,
        dispensed_by_name: actor.name,
        dispensed_at: now,
        notes: input.notes || null,
        status: 'completed',
        total_amount: totalAmount,
        total_items: createdItems.length,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        items: createdItems,
        prescription: updatedRx,
      };

      this.records.unshift(newRecord);
      this.processedIdempotencyKeys.add(input.idempotency_key);

      return newRecord;
    } catch (error) {
      // ROLLBACK: Restore previous state if any step fails
      inventoryStore.restoreSnapshot(inventorySnapshot);
      prescriptionStore.restoreSnapshot(prescriptionSnapshot);
      throw error;
    }
  }

  public reverseDispensing(
    input: ReverseDispensingInput,
    actor: { id: string; name: string },
  ): DispensingWithDetails {
    const recordIndex = this.records.findIndex((r) => r.id === input.dispensing_record_id);
    if (recordIndex === -1) {
      throw new Error(`Dispensing record not found: ${input.dispensing_record_id}`);
    }

    const record = this.records[recordIndex];
    if (record.status === 'reversed' || record.deleted_at !== null) {
      throw new Error(
        `Dispensing record ${record.dispensing_number} has already been reversed. Double restoration is prohibited.`,
      );
    }

    const inventorySnapshot = inventoryStore.snapshot();
    const prescriptionSnapshot = prescriptionStore.snapshot();

    try {
      // 1. Compensating stock adjustments
      for (const item of record.items) {
        inventoryStore.reverseDispensedStock(
          {
            batch_id: item.medicine_batch_id,
            quantity: item.quantity_dispensed,
            dispensing_record_id: record.id,
            dispensing_item_id: item.id,
            dispensing_number: record.dispensing_number,
            reason: input.reason,
          },
          actor,
        );
      }

      // 2. Decrement prescription counters
      const updatedRx = prescriptionStore.reverseDispensedItems(
        record.prescription_id,
        record.items.map((it) => ({
          prescriptionItemId: it.prescription_item_id,
          quantity: it.quantity_dispensed,
        })),
      );

      // 3. Update record status
      const now = new Date().toISOString();
      const updatedRecord: DispensingWithDetails = {
        ...record,
        status: 'reversed',
        deleted_at: now,
        updated_at: now,
        notes: `${record.notes || ''} [REVERSED by ${actor.name}: ${input.reason}]`.trim(),
        prescription: updatedRx,
      };

      this.records[recordIndex] = updatedRecord;
      return updatedRecord;
    } catch (error) {
      inventoryStore.restoreSnapshot(inventorySnapshot);
      prescriptionStore.restoreSnapshot(prescriptionSnapshot);
      throw error;
    }
  }

  public getDispensingRecords(params: DispensingFilterParams = {}): PaginatedDispensingResult {
    let filtered = [...this.records];

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.dispensing_number.toLowerCase().includes(q) ||
          r.prescription_number.toLowerCase().includes(q) ||
          r.patient_name.toLowerCase().includes(q) ||
          r.mr_number.toLowerCase().includes(q),
      );
    }

    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((r) => r.status === params.status);
    }

    if (params.patient_id) {
      filtered = filtered.filter((r) => r.patient_id === params.patient_id);
    }

    if (params.prescription_id) {
      filtered = filtered.filter((r) => r.prescription_id === params.prescription_id);
    }

    if (params.date_from) {
      filtered = filtered.filter((r) => r.dispensed_at.slice(0, 10) >= params.date_from!);
    }

    if (params.date_to) {
      filtered = filtered.filter((r) => r.dispensed_at.slice(0, 10) <= params.date_to!);
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const records = filtered.slice(start, start + pageSize);

    return {
      records,
      total,
      page,
      pageSize,
      totalPages,
      isLiveDatabase: false,
    };
  }

  public getDispensingById(id: string): DispensingWithDetails | null {
    const record = this.records.find((r) => r.id === id);
    if (!record) return null;

    // Attach current prescription status
    const rx = prescriptionStore.getById(record.prescription_id);
    return {
      ...record,
      prescription: rx || record.prescription,
    };
  }

  public getOverviewKPIs(): DispensingOverviewKPIs {
    const latest = this.records[0];
    const todayStr = latest ? latest.dispensed_at.slice(0, 10) : '2026-10-12';
    const todayRecords = this.records.filter((r) => r.dispensed_at.slice(0, 10) === todayStr);

    let totalUnits = 0;
    todayRecords.forEach((r) => {
      if (r.status === 'completed') {
        r.items.forEach((it) => {
          totalUnits += it.quantity_dispensed;
        });
      }
    });

    const allPrescriptions = prescriptionStore.getAll();
    const pendingRx = allPrescriptions.filter((rx) => rx.status === 'pending').length;
    const partialRx = allPrescriptions.filter((rx) => rx.status === 'partially_dispensed').length;
    const reversedCount = this.records.filter((r) => r.status === 'reversed').length;

    return {
      total_dispensed_today: todayRecords.filter((r) => r.status === 'completed').length,
      total_units_dispensed_today: totalUnits,
      pending_prescriptions_count: pendingRx,
      partially_dispensed_count: partialRx,
      reversed_dispensations_count: reversedCount,
    };
  }

  public quickDispensePaperRequisition(
    input: {
      ssp_visit_no?: string | null;
      patient_name: string;
      mr_number?: string | null;
      ward: string;
      bed_number?: string | null;
      prescriber_name?: string | null;
      notes?: string | null;
      items: {
        medicine_id: string;
        quantity: number;
        unit_price?: number;
      }[];
    },
    actor: { id: string; name: string } = {
      id: 'usr-pharmacist-001',
      name: 'Dr. Tariq Khan (Pharmacist)',
    },
  ): DispensingWithDetails {
    if (!input.items || input.items.length === 0) {
      throw new Error('Please add at least one medicine or surgical consumable item to dispense.');
    }

    const now = new Date().toISOString();
    const cleanSsp = input.ssp_visit_no?.trim() || null;
    const cleanPatientName = input.patient_name.trim() || 'Ward Inpatient';
    const mrn = input.mr_number?.trim() || `MRN-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    // 1. Find or create patient
    let patient = PatientPrototypeStore.getAll().find(
      (p) =>
        p.mr_number.toUpperCase() === mrn.toUpperCase() ||
        p.full_name.toLowerCase() === cleanPatientName.toLowerCase(),
    );
    if (!patient) {
      patient = PatientPrototypeStore.create({
        mr_number: mrn,
        full_name: cleanPatientName,
        gender: 'male',
      });
    }

    // 2. Find or create admission
    let admission = cleanSsp ? AdmissionPrototypeStore.getBySspVisitNo(cleanSsp) : null;
    if (!admission && input.ward) {
      admission = AdmissionPrototypeStore.create({
        patient_id: patient.id,
        admission_number: `ADM-${Date.now().toString().slice(-5)}`,
        ssp_visit_no: cleanSsp,
        admission_date: now,
        ward: input.ward.trim(),
        bed_number: input.bed_number?.trim() || null,
        attending_doctor: input.prescriber_name?.trim() || 'Staff Physician',
        status: 'admitted',
      });
    }

    // 3. Create prescription
    const rxNumber = `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rx = prescriptionStore.create(
      {
        prescription_number: rxNumber,
        patient_id: patient.id,
        admission_id: admission ? admission.id : null,
        prescriber_name: input.prescriber_name?.trim() || 'Ward Medical Officer',
        prescription_date: now.slice(0, 10),
        notes: input.notes || 'Counter Quick Dispense from Ward Requisition Form',
        items: input.items.map((it) => ({
          medicine_id: it.medicine_id,
          prescribed_quantity: it.quantity,
          dosage_instructions: 'As directed',
        })),
      },
      {
        id: patient.id,
        mr_number: patient.mr_number,
        full_name: patient.full_name,
        gender: patient.gender,
      },
      admission
        ? {
            id: admission.id,
            admission_number: admission.admission_number,
            ssp_visit_no: admission.ssp_visit_no,
            ward: admission.ward,
            bed_number: admission.bed_number,
            status: admission.status,
          }
        : null,
    );

    // 4. For each item, allocate batch (FEFO) and deduct stock
    const createdItems: DispensingItemDetail[] = [];
    const lineDisbursedAmounts: number[] = [];
    const dispensingId = `dsp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const dispensingNumber = `DSP-${now.slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    for (let i = 0; i < input.items.length; i++) {
      const it = input.items[i];
      const rxItem = rx.items[i];
      const med = medicineStore.getAllRawMedicines().find((m) => m.id === it.medicine_id);

      const batches = inventoryStore
        .getBatchesForMedicine(it.medicine_id)
        .filter((b) => b.status === 'available' && b.quantity_on_hand > 0)
        .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

      const batch = batches[0];
      const unitRate = it.unit_price ?? batch?.unit_cost ?? 100.0;
      const lineTotal = multiplyMoney(it.quantity, unitRate);
      lineDisbursedAmounts.push(lineTotal);

      const itemId = `dspi-${Date.now()}-${i}`;
      if (batch) {
        inventoryStore.dispenseBatchStock(
          {
            batch_id: batch.id,
            quantity: it.quantity,
            dispensing_record_id: dispensingId,
            dispensing_item_id: itemId,
            dispensing_number: dispensingNumber,
            prescription_number: rxNumber,
            notes: 'Quick Counter Requisition Dispense',
            idempotency_key: `quick-${dispensingId}-${i}`,
          },
          actor,
        );
      }

      createdItems.push({
        id: itemId,
        dispensing_record_id: dispensingId,
        prescription_item_id: rxItem.id,
        medicine_batch_id: batch ? batch.id : 'bat-emergency',
        dispensed_medicine_id: it.medicine_id,
        quantity_dispensed: it.quantity,
        unit_price: unitRate,
        total_price: lineTotal,
        created_at: now,
        prescribed_medicine_name: med ? med.name : 'Prescribed Item',
        dispensed_medicine_name: med ? med.name : 'Dispensed Item',
        strength: med ? med.strength : 'Standard',
        dosage_form: med ? med.dosage_form : 'Piece',
        batch_number: batch ? batch.batch_number : 'B-QUICK-2026',
        expiry_date: batch ? batch.expiry_date : '2028-12-31',
        is_substitution: false,
        substitution_reason: null,
        is_fefo_override: false,
        fefo_override_reason: null,
      });
    }

    prescriptionStore.recordDispensedItems(
      rx.id,
      input.items.map((it, idx) => ({
        prescriptionItemId: rx.items[idx].id,
        quantity: it.quantity,
      })),
    );

    const totalAmount = addMoney(...lineDisbursedAmounts);
    const completedRecord: DispensingWithDetails = {
      id: dispensingId,
      dispensing_number: dispensingNumber,
      prescription_id: rx.id,
      prescription_number: rxNumber,
      patient_id: patient.id,
      patient_name: patient.full_name,
      mr_number: patient.mr_number,
      admission_id: admission ? admission.id : null,
      admission_number: admission ? admission.admission_number : null,
      ssp_visit_no: cleanSsp,
      ward: admission ? admission.ward : input.ward || null,
      bed_number: admission ? admission.bed_number : input.bed_number || null,
      dispensed_by: actor.id,
      dispensed_by_name: actor.name,
      dispensed_at: now,
      notes: input.notes || 'Dispensed via 1-Screen Quick Counter',
      status: 'completed',
      total_amount: totalAmount,
      total_items: createdItems.length,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      items: createdItems,
      prescription: rx,
    };

    this.records = [completedRecord, ...this.records];
    return completedRecord;
  }

  public resetForTesting(): void {
    this.records = [...initialDispensingRecords];
    this.processedIdempotencyKeys.clear();
  }
}

export const dispensingStore = new DispensingPrototypeStore();
