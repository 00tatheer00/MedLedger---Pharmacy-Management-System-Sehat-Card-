import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { AdmissionWithPatient, AdmissionFilterParams, PaginatedAdmissionsResult } from './types';
import { PatientWithRelations } from '../patients/types';
import { AdmissionPrototypeStore } from './prototype-store';
import { PatientPrototypeStore } from '../patients/prototype-store';

/**
 * Retrieves paginated admissions list with optional search and ward/status filters.
 */
export async function getAdmissions(
  params: AdmissionFilterParams = {},
): Promise<PaginatedAdmissionsResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
  const search = (params.search || '').trim().toLowerCase();
  const status = params.status && params.status !== 'all' ? params.status : undefined;
  const ward = params.ward?.trim().toLowerCase();

  // Supabase PostgreSQL path
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let query = supabase
        .from('admissions')
        .select('*, patients(*)', { count: 'exact' })
        .is('deleted_at', null);

      if (status) {
        query = query.eq('status', status);
      }

      if (params.patientId) {
        query = query.eq('patient_id', params.patientId);
      }

      if (params.sspVisitNo) {
        query = query.eq('ssp_visit_no', params.sspVisitNo.trim().toUpperCase());
      }

      if (search) {
        query = query.or(
          `admission_number.ilike.%${search}%,ssp_visit_no.ilike.%${search}%,ward.ilike.%${search}%,attending_doctor.ilike.%${search}%`,
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('admission_date', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Database error fetching admissions: ${error.message}`);
      }

      if (data) {
        const total = count || data.length;
        const admissions: AdmissionWithPatient[] = data.map((row: Record<string, unknown>) => ({
          ...(row as unknown as AdmissionWithPatient),
          patient: (row.patients as unknown as PatientWithRelations) || null,
        }));

        return {
          admissions,
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
  let all = AdmissionPrototypeStore.getAll();

  if (params.sspVisitNo) {
    const targetVisitNo = params.sspVisitNo.trim().toUpperCase();
    all = all.filter((a) => a.ssp_visit_no && a.ssp_visit_no.toUpperCase() === targetVisitNo);
  }

  if (params.patientId) {
    all = all.filter((a) => a.patient_id === params.patientId);
  }

  if (status) {
    all = all.filter((a) => a.status === status);
  }

  if (ward) {
    all = all.filter((a) => a.ward.toLowerCase().includes(ward));
  }

  // Join patient summary
  let enriched: AdmissionWithPatient[] = all.map((a) => {
    const patient = PatientPrototypeStore.getById(a.patient_id);
    return {
      ...a,
      patient: patient || null,
    };
  });

  if (search) {
    enriched = enriched.filter(
      (a) =>
        a.admission_number.toLowerCase().includes(search) ||
        (a.ssp_visit_no && a.ssp_visit_no.toLowerCase().includes(search)) ||
        a.ward.toLowerCase().includes(search) ||
        (a.attending_doctor && a.attending_doctor.toLowerCase().includes(search)) ||
        (a.patient && a.patient.full_name.toLowerCase().includes(search)) ||
        (a.patient && a.patient.mr_number.toLowerCase().includes(search)),
    );
  }

  const total = enriched.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = enriched.slice(startIndex, startIndex + pageSize);

  return {
    admissions: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    isLiveDatabase: false,
  };
}

/**
 * Retrieves admissions for a specific patient.
 */
export async function getAdmissionsForPatient(patientId: string): Promise<AdmissionWithPatient[]> {
  const result = await getAdmissions({ patientId, pageSize: 50 });
  return result.admissions;
}

/**
 * Retrieves a single admission by ID.
 */
export async function getAdmissionById(id: string): Promise<AdmissionWithPatient | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('admissions')
        .select('*, patients(*)')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error fetching admission ${id}: ${error.message}`);
      }

      if (data) {
        return {
          ...(data as unknown as AdmissionWithPatient),
          patient: (data.patients as unknown as PatientWithRelations) || null,
        };
      }
      return null;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  const found = AdmissionPrototypeStore.getById(id);
  if (!found) return null;

  const patient = PatientPrototypeStore.getById(found.patient_id);
  return {
    ...found,
    patient,
  };
}

/**
 * Checks whether an admission number already exists.
 */
export async function checkAdmissionNumberExists(
  admNumber: string,
  excludeId?: string,
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let q = supabase
        .from('admissions')
        .select('id')
        .eq('admission_number', admNumber.trim().toUpperCase())
        .is('deleted_at', null);

      if (excludeId) {
        q = q.neq('id', excludeId);
      }

      const { data, error } = await q;
      if (error) {
        throw new Error(`Database error checking admission number ${admNumber}: ${error.message}`);
      }
      return Boolean(data && data.length > 0);
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return AdmissionPrototypeStore.existsAdmissionNumber(admNumber, excludeId);
}

/**
 * Checks whether an SSP Visit Number is already assigned to another admission.
 */
export async function checkSspVisitNoExists(
  sspVisitNo: string,
  excludeId?: string,
): Promise<boolean> {
  const visitNo = sspVisitNo.trim().toUpperCase();
  if (!visitNo) return false;

  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let q = supabase
        .from('admissions')
        .select('id')
        .eq('ssp_visit_no', visitNo)
        .is('deleted_at', null);

      if (excludeId) {
        q = q.neq('id', excludeId);
      }

      const { data, error } = await q;
      if (error) {
        throw new Error(`Database error checking SSP Visit Number ${visitNo}: ${error.message}`);
      }
      return Boolean(data && data.length > 0);
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return AdmissionPrototypeStore.existsSspVisitNo(visitNo, excludeId);
}
