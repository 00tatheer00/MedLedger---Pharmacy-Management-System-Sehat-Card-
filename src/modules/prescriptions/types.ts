import { Prescription, PrescriptionItem, PrescriptionStatus } from '@/core/database/schema-types';

export type { Prescription, PrescriptionItem, PrescriptionStatus };

export interface PrescriptionMedicineSummary {
  id: string;
  name: string;
  generic_name: string;
  dosage_form: string;
  strength: string;
  category: string;
}

export interface PrescriptionItemWithMedicine extends PrescriptionItem {
  medicine: PrescriptionMedicineSummary;
}

export interface PrescriptionPatientSummary {
  id: string;
  mr_number: string;
  full_name: string;
  gender: string;
  phone?: string | null;
  cnic?: string | null;
}

export interface PrescriptionAdmissionSummary {
  id: string;
  admission_number: string;
  ssp_visit_no?: string | null;
  ward: string;
  bed_number?: string | null;
  status: string;
}

export interface PrescriptionWithDetails extends Prescription {
  patient: PrescriptionPatientSummary;
  admission?: PrescriptionAdmissionSummary | null;
  items: PrescriptionItemWithMedicine[];
}

export interface CreatePrescriptionItemInput {
  medicine_id: string;
  prescribed_quantity: number;
  dosage_instructions?: string | null;
  notes?: string | null;
}

export interface CreatePrescriptionInput {
  prescription_number: string;
  patient_id: string;
  admission_id?: string | null;
  prescriber_name: string;
  prescription_date: string;
  notes?: string | null;
  items: CreatePrescriptionItemInput[];
}

export interface PrescriptionFilterParams {
  search?: string;
  status?: PrescriptionStatus | 'all';
  patientId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPrescriptionsResult {
  prescriptions: PrescriptionWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLiveDatabase: boolean;
}
