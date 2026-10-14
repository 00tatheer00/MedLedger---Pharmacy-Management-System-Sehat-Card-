import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { Admission } from '../admissions/types';
import { Prescription } from '../prescriptions/types';
import { PatientWithRelations, PatientFilterParams, PaginatedPatientsResult } from './types';
import { PatientPrototypeStore } from './prototype-store';
import { AdmissionPrototypeStore } from '../admissions/prototype-store';
import { PrescriptionPrototypeStore } from '../prescriptions/prototype-store';

interface PatientRow {
  id: string;
  mr_number: string;
  full_name: string;
  father_name: string | null;
  cnic: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other';
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  admissions?: Admission[];
  prescriptions?: Prescription[];
}

/**
 * Retrieves paginated patients list with optional search and filters.
 */
export async function getPatients(
  params: PatientFilterParams = {},
): Promise<PaginatedPatientsResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
  const search = (params.search || '').trim().toLowerCase();
  const gender = params.gender && params.gender !== 'all' ? params.gender : undefined;

  // Supabase PostgreSQL path (when live database is configured)
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let query = supabase
        .from('patients')
        .select('*, admissions(id, status, ward), prescriptions(id)', { count: 'exact' })
        .is('deleted_at', null);

      if (gender) {
        query = query.eq('gender', gender);
      }

      if (search) {
        query = query.or(
          `mr_number.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%,cnic.ilike.%${search}%`,
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Database error fetching patients: ${error.message}`);
      }

      if (data) {
        const total = count || data.length;
        const patients: PatientWithRelations[] = (data as unknown as PatientRow[]).map((row) => ({
          ...row,
          admissionCount: row.admissions?.length || 0,
          prescriptionCount: row.prescriptions?.length || 0,
          activeAdmission:
            (row.admissions?.find((a) => a.status === 'admitted') as unknown as Admission) || null,
        }));

        return {
          patients,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          isLiveDatabase: true,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  // Development Prototype Mode
  let all = PatientPrototypeStore.getAll();

  if (gender) {
    all = all.filter((p) => p.gender === gender);
  }

  if (search) {
    all = all.filter(
      (p) =>
        p.mr_number.toLowerCase().includes(search) ||
        p.full_name.toLowerCase().includes(search) ||
        (p.phone && p.phone.toLowerCase().includes(search)) ||
        (p.cnic && p.cnic.toLowerCase().includes(search)),
    );
  }

  // Link relation counts from prototype stores
  const enriched: PatientWithRelations[] = all.map((p) => {
    const admissions = AdmissionPrototypeStore.getByPatientId(p.id);
    const activeAdmission = admissions.find((a) => a.status === 'admitted') || null;
    const prescriptions = PrescriptionPrototypeStore.getByPatientId(p.id);

    return {
      ...p,
      admissions,
      activeAdmission,
      prescriptions,
      admissionCount: admissions.length,
      prescriptionCount: prescriptions.length,
    };
  });

  if (params.admissionStatus === 'admitted') {
    all = enriched.filter((p) => Boolean(p.activeAdmission));
  } else if (params.admissionStatus === 'outpatient') {
    all = enriched.filter((p) => !p.activeAdmission);
  } else {
    all = enriched;
  }

  const total = all.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = all.slice(startIndex, startIndex + pageSize);

  return {
    patients: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    isLiveDatabase: false,
  };
}

/**
 * Retrieves a single patient by ID with full admission and prescription history.
 */
export async function getPatientById(id: string): Promise<PatientWithRelations | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('patients')
        .select('*, admissions(*), prescriptions(*)')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error fetching patient ${id}: ${error.message}`);
      }

      if (data) {
        const row = data as unknown as PatientRow;
        const activeAdmission = row.admissions?.find((a) => a.status === 'admitted') || null;
        return {
          ...row,
          admissionCount: row.admissions?.length || 0,
          prescriptionCount: row.prescriptions?.length || 0,
          activeAdmission,
        };
      }
      return null;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  const patient = PatientPrototypeStore.getById(id);
  if (!patient) return null;

  const admissions = AdmissionPrototypeStore.getByPatientId(patient.id);
  const activeAdmission = admissions.find((a) => a.status === 'admitted') || null;
  const prescriptions = PrescriptionPrototypeStore.getByPatientId(patient.id);

  return {
    ...patient,
    admissions,
    activeAdmission,
    prescriptions,
    admissionCount: admissions.length,
    prescriptionCount: prescriptions.length,
  };
}

/**
 * Checks whether an MR number already exists in the system.
 */
export async function checkMrNumberExists(mrNumber: string, excludeId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let q = supabase
        .from('patients')
        .select('id')
        .eq('mr_number', mrNumber.trim().toUpperCase())
        .is('deleted_at', null);

      if (excludeId) {
        q = q.neq('id', excludeId);
      }

      const { data, error } = await q;
      if (error) {
        throw new Error(`Database error checking MR number ${mrNumber}: ${error.message}`);
      }
      return Boolean(data && data.length > 0);
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return PatientPrototypeStore.existsMrNumber(mrNumber, excludeId);
}
