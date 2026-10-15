import {
  PrescriptionWithDetails,
  PrescriptionItemWithMedicine,
  CreatePrescriptionInput,
  PrescriptionMedicineSummary,
} from './types';
import { catalogueMedicines } from '@/lib/demo-data';

const medicinesMap: Record<string, PrescriptionMedicineSummary> = {};
catalogueMedicines.forEach((m) => {
  medicinesMap[m.id] = {
    id: m.id,
    name: m.name,
    generic_name: m.genericName,
    dosage_form: m.dosageForm,
    strength: m.strength,
    category: m.category,
  };
});

const initialPrescriptions: PrescriptionWithDetails[] = [
  {
    id: 'rx-001-kohat',
    prescription_number: 'RX-2026-0041',
    patient_id: 'pat-001-kohat',
    admission_id: 'adm-001-kohat',
    prescriber_name: 'Dr. Asad Qureshi',
    prescription_date: '2026-10-12',
    status: 'pending',
    notes:
      'Inpatient prescription transcribed from Male Medical Ward slip. Urgent pneumonia coverage.',
    created_by: 'usr-pharmacist-001',
    created_at: '2026-10-12T09:15:00.000Z',
    updated_at: '2026-10-12T09:15:00.000Z',
    deleted_at: null,
    patient: {
      id: 'pat-001-kohat',
      mr_number: 'MRN-2026-00101',
      full_name: 'Tariq Mehmood',
      gender: 'male',
      phone: '+92-333-9123456',
      cnic: '14301-1234567-1',
    },
    admission: {
      id: 'adm-001-kohat',
      admission_number: 'ADM-2026-0412',
      ssp_visit_no: '37634827',
      ward: 'Male Medical Ward',
      bed_number: 'Bed 14',
      status: 'admitted',
    },
    items: [
      {
        id: 'rxi-001-01',
        prescription_id: 'rx-001-kohat',
        medicine_id: 'med-002',
        prescribed_quantity: 6,
        dispensed_quantity: 0,
        dosage_instructions: '1g IV BD × 3 days',
        status: 'pending',
        notes: 'Administer slow IV infusion over 30 mins',
        created_at: '2026-10-12T09:15:00.000Z',
        updated_at: '2026-10-12T09:15:00.000Z',
        medicine: medicinesMap['med-002'],
      },
      {
        id: 'rxi-001-02',
        prescription_id: 'rx-001-kohat',
        medicine_id: 'med-005',
        prescribed_quantity: 14,
        dispensed_quantity: 0,
        dosage_instructions: '1 cap daily before breakfast',
        status: 'pending',
        notes: 'GI mucosal prophylaxis',
        created_at: '2026-10-12T09:15:00.000Z',
        updated_at: '2026-10-12T09:15:00.000Z',
        medicine: medicinesMap['med-005'],
      },
    ],
  },
  {
    id: 'rx-002-kohat',
    prescription_number: 'RX-2026-0042',
    patient_id: 'pat-002-kohat',
    admission_id: 'adm-002-kohat',
    prescriber_name: 'Dr. Noreen Khattak',
    prescription_date: '2026-10-12',
    status: 'pending',
    notes: 'Post-operative analgesic and antimicrobial regimen from Female Surgical Ward.',
    created_by: 'usr-pharmacist-001',
    created_at: '2026-10-12T11:30:00.000Z',
    updated_at: '2026-10-12T11:30:00.000Z',
    deleted_at: null,
    patient: {
      id: 'pat-002-kohat',
      mr_number: 'MRN-2026-00102',
      full_name: 'Fatima Bibi',
      gender: 'female',
      phone: '+92-345-8765432',
      cnic: '14301-7654321-2',
    },
    admission: {
      id: 'adm-002-kohat',
      admission_number: 'ADM-2026-0398',
      ssp_visit_no: '37643797',
      ward: 'Female Surgical Ward',
      bed_number: 'Bed 06',
      status: 'admitted',
    },
    items: [
      {
        id: 'rxi-002-01',
        prescription_id: 'rx-002-kohat',
        medicine_id: 'med-001',
        prescribed_quantity: 21,
        dispensed_quantity: 0,
        dosage_instructions: '1 cap TDS × 7 days',
        status: 'pending',
        notes: 'Take after meals with water',
        created_at: '2026-10-12T11:30:00.000Z',
        updated_at: '2026-10-12T11:30:00.000Z',
        medicine: medicinesMap['med-001'],
      },
      {
        id: 'rxi-002-02',
        prescription_id: 'rx-002-kohat',
        medicine_id: 'med-004',
        prescribed_quantity: 15,
        dispensed_quantity: 0,
        dosage_instructions: '1 tab TDS for fever/pain',
        status: 'pending',
        notes: null,
        created_at: '2026-10-12T11:30:00.000Z',
        updated_at: '2026-10-12T11:30:00.000Z',
        medicine: medicinesMap['med-004'],
      },
    ],
  },
  {
    id: 'rx-003-kohat',
    prescription_number: 'RX-2026-0043',
    patient_id: 'pat-003-kohat',
    admission_id: null, // Outpatient walk-in prescription!
    prescriber_name: 'Dr. Tariq Bangash',
    prescription_date: '2026-10-11',
    status: 'pending',
    notes: 'Outpatient dispensary slip. Prescribed at OPD clinic.',
    created_by: 'usr-pharmacist-001',
    created_at: '2026-10-11T14:45:00.000Z',
    updated_at: '2026-10-11T14:45:00.000Z',
    deleted_at: null,
    patient: {
      id: 'pat-003-kohat',
      mr_number: 'MRN-2026-00103',
      full_name: 'Muhammad Usman',
      gender: 'male',
      phone: '+92-300-5544332',
      cnic: null,
    },
    admission: null,
    items: [
      {
        id: 'rxi-003-01',
        prescription_id: 'rx-003-kohat',
        medicine_id: 'med-003',
        prescribed_quantity: 30,
        dispensed_quantity: 0,
        dosage_instructions: '1 tab BD after meals',
        status: 'pending',
        notes: 'Monthly glycemic maintenance',
        created_at: '2026-10-11T14:45:00.000Z',
        updated_at: '2026-10-11T14:45:00.000Z',
        medicine: medicinesMap['med-003'],
      },
    ],
  },
];

declare global {
  var __medledger_prescriptions: PrescriptionWithDetails[] | undefined;
}

function getStoreData(): PrescriptionWithDetails[] {
  if (!globalThis.__medledger_prescriptions) {
    globalThis.__medledger_prescriptions = [...initialPrescriptions];
  }
  return globalThis.__medledger_prescriptions;
}

function setStoreData(data: PrescriptionWithDetails[]): void {
  globalThis.__medledger_prescriptions = data;
}

export const PrescriptionPrototypeStore = {
  getAll(): PrescriptionWithDetails[] {
    return getStoreData().filter((rx) => rx.deleted_at === null);
  },

  getById(id: string): PrescriptionWithDetails | null {
    const found = getStoreData().find((rx) => rx.id === id && rx.deleted_at === null);
    return found || null;
  },

  getByPatientId(patientId: string): PrescriptionWithDetails[] {
    return getStoreData().filter((rx) => rx.patient_id === patientId && rx.deleted_at === null);
  },

  getByPrescriptionNumber(num: string): PrescriptionWithDetails | null {
    const normalized = num.trim().toUpperCase();
    const found = getStoreData().find(
      (rx) => rx.prescription_number.toUpperCase() === normalized && rx.deleted_at === null,
    );
    return found || null;
  },

  existsPrescriptionNumber(num: string, excludeId?: string): boolean {
    const normalized = num.trim().toUpperCase();
    return getStoreData().some(
      (rx) =>
        rx.prescription_number.toUpperCase() === normalized &&
        rx.deleted_at === null &&
        (!excludeId || rx.id !== excludeId),
    );
  },

  create(
    input: CreatePrescriptionInput,
    patientSummary: {
      id: string;
      mr_number: string;
      full_name: string;
      gender: string;
      phone?: string | null;
      cnic?: string | null;
    },
    admissionSummary?: {
      id: string;
      admission_number: string;
      ssp_visit_no?: string | null;
      ward: string;
      bed_number?: string | null;
      status: string;
    } | null,
  ): PrescriptionWithDetails {
    const prescriptionId = `rx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const items: PrescriptionItemWithMedicine[] = input.items.map((it, idx) => {
      const med = medicinesMap[it.medicine_id] || {
        id: it.medicine_id,
        name: 'Catalogue Medicine',
        generic_name: 'Standard Formula',
        dosage_form: 'Unit',
        strength: 'Standard',
        category: 'General',
      };

      return {
        id: `rxi-${Date.now()}-${idx}`,
        prescription_id: prescriptionId,
        medicine_id: it.medicine_id,
        prescribed_quantity: it.prescribed_quantity,
        dispensed_quantity: 0, // Invariant: starts at 0, no stock deducted
        dosage_instructions: it.dosage_instructions?.trim() || null,
        status: 'pending',
        notes: it.notes?.trim() || null,
        created_at: now,
        updated_at: now,
        medicine: med,
      };
    });

    const newPrescription: PrescriptionWithDetails = {
      id: prescriptionId,
      prescription_number: input.prescription_number.trim().toUpperCase(),
      patient_id: input.patient_id,
      admission_id: input.admission_id || null,
      prescriber_name: input.prescriber_name.trim(),
      prescription_date: input.prescription_date,
      status: 'pending',
      notes: input.notes?.trim() || null,
      created_by: 'usr-pharmacist-001',
      created_at: now,
      updated_at: now,
      deleted_at: null,
      patient: patientSummary,
      admission: admissionSummary || null,
      items,
    };

    setStoreData([newPrescription, ...getStoreData()]);
    return newPrescription;
  },

  cancel(id: string, reason?: string): PrescriptionWithDetails | null {
    const store = getStoreData();
    const index = store.findIndex((rx) => rx.id === id && rx.deleted_at === null);
    if (index === -1) return null;

    const existing = store[index];
    const now = new Date().toISOString();

    const updatedItems = existing.items.map((it) => ({
      ...it,
      status: 'cancelled' as const,
      updated_at: now,
    }));

    const updated: PrescriptionWithDetails = {
      ...existing,
      status: 'cancelled',
      notes: reason ? `${existing.notes || ''} [Cancelled: ${reason}]`.trim() : existing.notes,
      items: updatedItems,
      updated_at: now,
    };

    store[index] = updated;
    setStoreData([...store]);
    return updated;
  },

  recordDispensedItems(
    prescriptionId: string,
    dispensedItems: { prescriptionItemId: string; quantity: number }[],
  ): PrescriptionWithDetails {
    const store = getStoreData();
    const index = store.findIndex((rx) => rx.id === prescriptionId && rx.deleted_at === null);
    if (index === -1) {
      throw new Error(`Prescription not found: ${prescriptionId}`);
    }

    const rx = store[index];
    if (rx.status === 'cancelled') {
      throw new Error(`Cannot dispense cancelled prescription ${rx.prescription_number}.`);
    }

    const now = new Date().toISOString();
    const updatedItems = rx.items.map((it) => {
      const match = dispensedItems.find((d) => d.prescriptionItemId === it.id);
      if (!match) return it;

      const newDispensed = it.dispensed_quantity + match.quantity;
      if (newDispensed > it.prescribed_quantity) {
        throw new Error(
          `Over-dispensing prohibited on ${it.medicine.name}: prescribed ${it.prescribed_quantity}, previously dispensed ${it.dispensed_quantity}, attempted ${match.quantity}.`,
        );
      }

      return {
        ...it,
        dispensed_quantity: newDispensed,
        status:
          newDispensed === it.prescribed_quantity
            ? ('fully_dispensed' as const)
            : ('partially_dispensed' as const),
        updated_at: now,
      };
    });

    const allFull = updatedItems.every((it) => it.dispensed_quantity >= it.prescribed_quantity);
    const anyDispensed = updatedItems.some((it) => it.dispensed_quantity > 0);
    const newStatus = allFull
      ? 'fully_dispensed'
      : anyDispensed
        ? 'partially_dispensed'
        : 'pending';

    const updatedRx: PrescriptionWithDetails = {
      ...rx,
      status: newStatus,
      items: updatedItems,
      updated_at: now,
    };

    store[index] = updatedRx;
    setStoreData([...store]);
    return updatedRx;
  },

  reverseDispensedItems(
    prescriptionId: string,
    dispensedItems: { prescriptionItemId: string; quantity: number }[],
  ): PrescriptionWithDetails {
    const store = getStoreData();
    const index = store.findIndex((rx) => rx.id === prescriptionId);
    if (index === -1) {
      throw new Error(`Prescription not found: ${prescriptionId}`);
    }

    const rx = store[index];
    const now = new Date().toISOString();

    const updatedItems = rx.items.map((it) => {
      const match = dispensedItems.find((d) => d.prescriptionItemId === it.id);
      if (!match) return it;

      const newDispensed = Math.max(0, it.dispensed_quantity - match.quantity);
      return {
        ...it,
        dispensed_quantity: newDispensed,
        status:
          newDispensed === 0
            ? ('pending' as const)
            : newDispensed >= it.prescribed_quantity
              ? ('fully_dispensed' as const)
              : ('partially_dispensed' as const),
        updated_at: now,
      };
    });

    const allFull = updatedItems.every((it) => it.dispensed_quantity >= it.prescribed_quantity);
    const anyDispensed = updatedItems.some((it) => it.dispensed_quantity > 0);
    const newStatus = allFull
      ? 'fully_dispensed'
      : anyDispensed
        ? 'partially_dispensed'
        : 'pending';

    const updatedRx: PrescriptionWithDetails = {
      ...rx,
      status: newStatus,
      items: updatedItems,
      updated_at: now,
    };

    store[index] = updatedRx;
    setStoreData([...store]);
    return updatedRx;
  },

  snapshot(): PrescriptionWithDetails[] {
    return JSON.parse(JSON.stringify(getStoreData()));
  },

  restoreSnapshot(snap: PrescriptionWithDetails[]): void {
    setStoreData(snap);
  },

  reset(): void {
    setStoreData([...initialPrescriptions]);
  },
};

export const prescriptionStore = PrescriptionPrototypeStore;
