import { Admission, AdmissionStatus } from '@/core/database/schema-types';
import { Patient } from '@/core/database/schema-types';

export type { Admission, AdmissionStatus };

export interface AdmissionWithPatient extends Admission {
  patient?: Patient | null;
}

export interface CreateAdmissionInput {
  patient_id: string;
  admission_number: string;
  ssp_visit_no?: string | null;
  admission_date: string;
  ward: string;
  bed_number?: string | null;
  attending_doctor?: string | null;
  status?: AdmissionStatus;
}

export interface UpdateAdmissionInput {
  discharge_date?: string | null;
  ssp_visit_no?: string | null;
  status?: AdmissionStatus;
  ward?: string;
  bed_number?: string | null;
  attending_doctor?: string | null;
}

export interface AdmissionFilterParams {
  patientId?: string;
  sspVisitNo?: string;
  ward?: string;
  status?: AdmissionStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAdmissionsResult {
  admissions: AdmissionWithPatient[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLiveDatabase: boolean;
}
