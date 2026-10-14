import { PatientWithRelations, CreatePatientInput, UpdatePatientInput } from './types';

/**
 * Initial Fictional Demonstration Patients for DHQ Hospital Kohat
 * Used strictly for UI evaluation when running without a configured Supabase database.
 */
const initialPatients: PatientWithRelations[] = [
  {
    id: 'pat-001-kohat',
    mr_number: 'MRN-2026-00101',
    full_name: 'Tariq Mehmood',
    father_name: 'Abdul Rehman',
    cnic: '14301-1234567-1',
    date_of_birth: '1982-04-15',
    gender: 'male',
    phone: '+92-333-9123456',
    address: 'KDA Sector 4, Kohat',
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
    deleted_at: null,
    admissionCount: 1,
    prescriptionCount: 2,
  },
  {
    id: 'pat-002-kohat',
    mr_number: 'MRN-2026-00102',
    full_name: 'Fatima Bibi',
    father_name: 'Sher Ali Khan',
    cnic: '14301-7654321-2',
    date_of_birth: '1990-11-20',
    gender: 'female',
    phone: '+92-345-8765432',
    address: 'Bannu Road, Mohallah Garhi Mawaz, Kohat',
    created_at: '2026-10-02T10:30:00.000Z',
    updated_at: '2026-10-02T10:30:00.000Z',
    deleted_at: null,
    admissionCount: 1,
    prescriptionCount: 1,
  },
  {
    id: 'pat-003-kohat',
    mr_number: 'MRN-2026-00103',
    full_name: 'Muhammad Usman',
    father_name: 'Ghulam Rasool',
    cnic: null, // Walk-in without confirmed CNIC
    date_of_birth: '2005-06-12',
    gender: 'male',
    phone: '+92-300-5544332',
    address: 'Hangu By-pass, Kohat',
    created_at: '2026-10-05T14:15:00.000Z',
    updated_at: '2026-10-05T14:15:00.000Z',
    deleted_at: null,
    admissionCount: 1,
    prescriptionCount: 1,
  },
  {
    id: 'pat-004-kohat',
    mr_number: 'MRN-2026-00104',
    full_name: 'Zainab Gul',
    father_name: 'Gul Baz Khan',
    cnic: '14301-9988776-4',
    date_of_birth: '1975-01-08',
    gender: 'female',
    phone: '+92-312-3322110',
    address: 'Jungle Khel, Kohat',
    created_at: '2026-10-08T11:00:00.000Z',
    updated_at: '2026-10-08T11:00:00.000Z',
    deleted_at: null,
    admissionCount: 0,
    prescriptionCount: 0,
  },
  {
    id: 'pat-005-kohat',
    mr_number: 'MRN-2026-00105',
    full_name: 'Inamullah Jan',
    father_name: 'Noorullah',
    cnic: '14301-4433221-5',
    date_of_birth: '1998-09-30',
    gender: 'male',
    phone: '+92-334-1122334',
    address: 'Peshawar Road, Kohat Cantt',
    created_at: '2026-10-10T16:45:00.000Z',
    updated_at: '2026-10-10T16:45:00.000Z',
    deleted_at: null,
    admissionCount: 0,
    prescriptionCount: 0,
  },
];

// In-memory array representing patient records in local development/prototype mode
let patientStore: PatientWithRelations[] = [...initialPatients];

export const PatientPrototypeStore = {
  getAll(): PatientWithRelations[] {
    return patientStore.filter((p) => p.deleted_at === null);
  },

  getById(id: string): PatientWithRelations | null {
    const found = patientStore.find((p) => p.id === id && p.deleted_at === null);
    return found || null;
  },

  getByMrNumber(mrNumber: string): PatientWithRelations | null {
    const normalized = mrNumber.trim().toUpperCase();
    const found = patientStore.find(
      (p) => p.mr_number.toUpperCase() === normalized && p.deleted_at === null,
    );
    return found || null;
  },

  existsMrNumber(mrNumber: string, excludeId?: string): boolean {
    const normalized = mrNumber.trim().toUpperCase();
    return patientStore.some(
      (p) =>
        p.mr_number.toUpperCase() === normalized &&
        p.deleted_at === null &&
        (!excludeId || p.id !== excludeId),
    );
  },

  create(input: CreatePatientInput): PatientWithRelations {
    const newPatient: PatientWithRelations = {
      id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      mr_number: input.mr_number.trim().toUpperCase(),
      full_name: input.full_name.trim(),
      father_name: input.father_name?.trim() || null,
      cnic: input.cnic?.trim() || null,
      date_of_birth: input.date_of_birth || null,
      gender: input.gender,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      admissionCount: 0,
      prescriptionCount: 0,
    };

    patientStore = [newPatient, ...patientStore];
    return newPatient;
  },

  update(id: string, input: UpdatePatientInput): PatientWithRelations | null {
    const index = patientStore.findIndex((p) => p.id === id && p.deleted_at === null);
    if (index === -1) return null;

    const existing = patientStore[index];
    const updated: PatientWithRelations = {
      ...existing,
      full_name: input.full_name !== undefined ? input.full_name.trim() : existing.full_name,
      father_name:
        input.father_name !== undefined ? input.father_name?.trim() || null : existing.father_name,
      cnic: input.cnic !== undefined ? input.cnic?.trim() || null : existing.cnic,
      date_of_birth:
        input.date_of_birth !== undefined ? input.date_of_birth || null : existing.date_of_birth,
      gender: input.gender !== undefined ? input.gender : existing.gender,
      phone: input.phone !== undefined ? input.phone?.trim() || null : existing.phone,
      address: input.address !== undefined ? input.address?.trim() || null : existing.address,
      updated_at: new Date().toISOString(),
    };

    patientStore[index] = updated;
    return updated;
  },

  reset(): void {
    patientStore = [...initialPatients];
  },
};
