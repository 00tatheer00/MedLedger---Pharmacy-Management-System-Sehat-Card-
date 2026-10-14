import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import {
  PrescriptionWithDetails,
  PrescriptionItemWithMedicine,
  PrescriptionFilterParams,
  PaginatedPrescriptionsResult,
  PrescriptionMedicineSummary,
} from './types';
import { PrescriptionPrototypeStore } from './prototype-store';
import { catalogueMedicines } from '@/lib/demo-data';

/**
 * Retrieves paginated prescriptions list with optional search and filters.
 */
export async function getPrescriptions(
  params: PrescriptionFilterParams = {},
): Promise<PaginatedPrescriptionsResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
  const search = (params.search || '').trim().toLowerCase();
  const status = params.status && params.status !== 'all' ? params.status : undefined;

  // Supabase PostgreSQL path
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let query = supabase
        .from('prescriptions')
        .select('*, patients(*), admissions(*), prescription_items(*, medicines(*))', {
          count: 'exact',
        })
        .is('deleted_at', null);

      if (status) {
        query = query.eq('status', status);
      }

      if (params.patientId) {
        query = query.eq('patient_id', params.patientId);
      }

      if (search) {
        query = query.or(`prescription_number.ilike.%${search}%,prescriber_name.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('prescription_date', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Database error fetching prescriptions: ${error.message}`);
      }

      if (data) {
        const total = count || data.length;
        const prescriptions: PrescriptionWithDetails[] = (
          data as Array<Record<string, unknown>>
        ).map((row) => ({
          ...(row as unknown as PrescriptionWithDetails),
          patient: row.patients as unknown as PrescriptionWithDetails['patient'],
          admission: (row.admissions as unknown as PrescriptionWithDetails['admission']) || null,
          items: ((row.prescription_items as Array<Record<string, unknown>>) || []).map((it) => ({
            ...(it as unknown as PrescriptionItemWithMedicine),
            medicine: (it.medicines as unknown as PrescriptionItemWithMedicine['medicine']) || null,
          })),
        }));

        return {
          prescriptions,
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
  let all = PrescriptionPrototypeStore.getAll();

  if (params.patientId) {
    all = all.filter((rx) => rx.patient_id === params.patientId);
  }

  if (status) {
    all = all.filter((rx) => rx.status === status);
  }

  if (search) {
    all = all.filter(
      (rx) =>
        rx.prescription_number.toLowerCase().includes(search) ||
        rx.prescriber_name.toLowerCase().includes(search) ||
        (rx.patient && rx.patient.full_name.toLowerCase().includes(search)) ||
        (rx.patient && rx.patient.mr_number.toLowerCase().includes(search)) ||
        rx.items.some((it) => it.medicine.name.toLowerCase().includes(search)),
    );
  }

  const total = all.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = all.slice(startIndex, startIndex + pageSize);

  return {
    prescriptions: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    isLiveDatabase: false,
  };
}

/**
 * Retrieves a single prescription with patient, admission, and full line item details.
 */
export async function getPrescriptionById(id: string): Promise<PrescriptionWithDetails | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*, patients(*), admissions(*), prescription_items(*, medicines(*))')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error fetching prescription ${id}: ${error.message}`);
      }

      if (data) {
        const row = data as Record<string, unknown>;
        return {
          ...(row as unknown as PrescriptionWithDetails),
          patient: row.patients as unknown as PrescriptionWithDetails['patient'],
          admission: (row.admissions as unknown as PrescriptionWithDetails['admission']) || null,
          items: ((row.prescription_items as Array<Record<string, unknown>>) || []).map((it) => ({
            ...(it as unknown as PrescriptionItemWithMedicine),
            medicine: (it.medicines as unknown as PrescriptionItemWithMedicine['medicine']) || null,
          })),
        };
      }
      return null;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return PrescriptionPrototypeStore.getById(id);
}

/**
 * Retrieves all prescriptions for a specific patient.
 */
export async function getPrescriptionsForPatient(
  patientId: string,
): Promise<PrescriptionWithDetails[]> {
  const result = await getPrescriptions({ patientId, pageSize: 50 });
  return result.prescriptions;
}

/**
 * Checks whether a prescription number already exists.
 */
export async function checkPrescriptionNumberExists(
  num: string,
  excludeId?: string,
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let q = supabase
        .from('prescriptions')
        .select('id')
        .eq('prescription_number', num.trim().toUpperCase())
        .is('deleted_at', null);

      if (excludeId) {
        q = q.neq('id', excludeId);
      }

      const { data, error } = await q;
      if (error) {
        throw new Error(`Database error checking prescription number ${num}: ${error.message}`);
      }
      return Boolean(data && data.length > 0);
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return PrescriptionPrototypeStore.existsPrescriptionNumber(num, excludeId);
}

/**
 * Retrieves available catalogue medicines for the prescription line item selector.
 */
export async function getPrescriptionMedicinesList(): Promise<PrescriptionMedicineSummary[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('medicines')
        .select('id, name, generic_name, dosage_form, strength, category')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name');

      if (error) {
        throw new Error(`Database error fetching prescription medicines: ${error.message}`);
      }

      if (data) {
        return data;
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return catalogueMedicines.map((m) => ({
    id: m.id,
    name: m.name,
    generic_name: m.genericName,
    dosage_form: m.dosageForm,
    strength: m.strength,
    category: m.category,
  }));
}
