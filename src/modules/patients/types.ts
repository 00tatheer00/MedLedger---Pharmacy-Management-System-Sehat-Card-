import { Patient, Gender } from '@/core/database/schema-types';
import { Admission } from '@/core/database/schema-types';
import { Prescription } from '@/core/database/schema-types';

export type { Patient, Gender };

export interface PatientWithRelations extends Patient {
  admissions?: Admission[];
  activeAdmission?: Admission | null;
  prescriptions?: Prescription[];
  admissionCount?: number;
  prescriptionCount?: number;
}

export interface CreatePatientInput {
  mr_number: string;
  full_name: string;
  father_name?: string | null;
  cnic?: string | null;
  date_of_birth?: string | null;
  gender: Gender;
  phone?: string | null;
  address?: string | null;
}

export interface UpdatePatientInput {
  full_name?: string;
  father_name?: string | null;
  cnic?: string | null;
  date_of_birth?: string | null;
  gender?: Gender;
  phone?: string | null;
  address?: string | null;
}

export interface PatientFilterParams {
  search?: string;
  gender?: Gender | 'all';
  admissionStatus?: 'all' | 'admitted' | 'outpatient';
  page?: number;
  pageSize?: number;
}

export interface PaginatedPatientsResult {
  patients: PatientWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLiveDatabase: boolean;
}
