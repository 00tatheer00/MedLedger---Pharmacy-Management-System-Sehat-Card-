import { Admission, CreateAdmissionInput, UpdateAdmissionInput } from './types';

const initialAdmissions: Admission[] = [
  {
    id: 'adm-001-kohat',
    patient_id: 'pat-001-kohat',
    admission_number: 'ADM-2026-0412',
    admission_date: '2026-10-09T08:30:00.000Z',
    discharge_date: null,
    ward: 'Male Medical Ward',
    bed_number: 'Bed 14',
    attending_doctor: 'Dr. Asad Qureshi',
    status: 'admitted',
    created_at: '2026-10-09T08:30:00.000Z',
    updated_at: '2026-10-09T08:30:00.000Z',
    deleted_at: null,
  },
  {
    id: 'adm-002-kohat',
    patient_id: 'pat-002-kohat',
    admission_number: 'ADM-2026-0398',
    admission_date: '2026-10-10T11:00:00.000Z',
    discharge_date: null,
    ward: 'Female Surgical Ward',
    bed_number: 'Bed 06',
    attending_doctor: 'Dr. Noreen Khattak',
    status: 'admitted',
    created_at: '2026-10-10T11:00:00.000Z',
    updated_at: '2026-10-10T11:00:00.000Z',
    deleted_at: null,
  },
  {
    id: 'adm-003-kohat',
    patient_id: 'pat-003-kohat',
    admission_number: 'ADM-2026-0350',
    admission_date: '2026-10-05T14:30:00.000Z',
    discharge_date: '2026-10-06T18:00:00.000Z',
    ward: 'Emergency Observation',
    bed_number: 'Bed 02',
    attending_doctor: 'Dr. Tariq Bangash',
    status: 'discharged',
    created_at: '2026-10-05T14:30:00.000Z',
    updated_at: '2026-10-06T18:00:00.000Z',
    deleted_at: null,
  },
];

let admissionStore: Admission[] = [...initialAdmissions];

export const AdmissionPrototypeStore = {
  getAll(): Admission[] {
    return admissionStore.filter((a) => a.deleted_at === null);
  },

  getById(id: string): Admission | null {
    const found = admissionStore.find((a) => a.id === id && a.deleted_at === null);
    return found || null;
  },

  getByPatientId(patientId: string): Admission[] {
    return admissionStore.filter((a) => a.patient_id === patientId && a.deleted_at === null);
  },

  getByAdmissionNumber(admissionNumber: string): Admission | null {
    const normalized = admissionNumber.trim().toUpperCase();
    const found = admissionStore.find(
      (a) => a.admission_number.toUpperCase() === normalized && a.deleted_at === null,
    );
    return found || null;
  },

  existsAdmissionNumber(admissionNumber: string, excludeId?: string): boolean {
    const normalized = admissionNumber.trim().toUpperCase();
    return admissionStore.some(
      (a) =>
        a.admission_number.toUpperCase() === normalized &&
        a.deleted_at === null &&
        (!excludeId || a.id !== excludeId),
    );
  },

  create(input: CreateAdmissionInput): Admission {
    const newAdmission: Admission = {
      id: `adm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patient_id: input.patient_id,
      admission_number: input.admission_number.trim().toUpperCase(),
      admission_date: input.admission_date,
      discharge_date: null,
      ward: input.ward.trim(),
      bed_number: input.bed_number?.trim() || null,
      attending_doctor: input.attending_doctor?.trim() || null,
      status: input.status || 'admitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    admissionStore = [newAdmission, ...admissionStore];
    return newAdmission;
  },

  update(id: string, input: UpdateAdmissionInput): Admission | null {
    const index = admissionStore.findIndex((a) => a.id === id && a.deleted_at === null);
    if (index === -1) return null;

    const existing = admissionStore[index];
    const updated: Admission = {
      ...existing,
      discharge_date:
        input.discharge_date !== undefined ? input.discharge_date : existing.discharge_date,
      status: input.status !== undefined ? input.status : existing.status,
      ward: input.ward !== undefined ? input.ward.trim() : existing.ward,
      bed_number:
        input.bed_number !== undefined ? input.bed_number?.trim() || null : existing.bed_number,
      attending_doctor:
        input.attending_doctor !== undefined
          ? input.attending_doctor?.trim() || null
          : existing.attending_doctor,
      updated_at: new Date().toISOString(),
    };

    admissionStore[index] = updated;
    return updated;
  },

  reset(): void {
    admissionStore = [...initialAdmissions];
  },
};
