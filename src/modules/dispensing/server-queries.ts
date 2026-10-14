/**
 * MedLedger — Dispensing Data Access Queries
 *
 * Implements data fetching boundary supporting both live Supabase PostgreSQL
 * and local prototype store fallback.
 * In staging and production tiers, unconfigured database or query errors fail-closed.
 */

import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { inventoryStore } from '@/modules/inventory/prototype-store';
import { dispensingStore } from './prototype-store';
import { evaluateFEFOBatches } from './fefo';
import {
  DispensingFilterParams,
  PaginatedDispensingResult,
  DispensingWithDetails,
  DispensingItemDetail,
  FEFOBatchCandidate,
  DispensingOverviewKPIs,
} from './types';

export async function fetchEligibleBatchesForMedicine(
  medicineId: string,
): Promise<FEFOBatchCandidate[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('medicine_batches')
        .select('*, medicine:medicines(*)')
        .eq('medicine_id', medicineId);

      if (error) {
        throw new Error(`Database error fetching eligible batches: ${error.message}`);
      }

      if (data) {
        return evaluateFEFOBatches(data, medicineId);
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  const rawBatches = inventoryStore.getBatchesForMedicine(medicineId);
  return evaluateFEFOBatches(rawBatches, medicineId);
}

interface SupabaseItemRow {
  id: string;
  dispensing_record_id: string;
  prescription_item_id: string;
  medicine_batch_id: string;
  dispensed_medicine_id: string;
  quantity_dispensed: number;
  unit_price: number | string;
  total_price: number | string;
  created_at: string;
  batch?: { batch_number?: string; expiry_date?: string } | null;
  medicine?: { name?: string; strength?: string; dosage_form?: string } | null;
}

interface SupabaseDispensingRow {
  id: string;
  dispensing_number: string;
  prescription_id: string;
  dispensed_by: string;
  dispensed_at: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  prescription?: {
    prescription_number?: string;
    patient?: { id?: string; full_name?: string; mr_number?: string } | null;
    admission?: {
      id?: string;
      admission_number?: string;
      ward?: string;
      bed_number?: string | null;
    } | null;
  } | null;
  dispenser?: { full_name?: string } | null;
  items?: SupabaseItemRow[] | null;
}

export async function fetchDispensingRecords(
  params: DispensingFilterParams = {},
): Promise<PaginatedDispensingResult> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (!supabase) throw new Error('Supabase client unavailable');
    let query = supabase
      .from('dispensing_records')
      .select(
        `
        id,
        dispensing_number,
        prescription_id,
        dispensed_by,
        dispensed_at,
        notes,
        created_at,
        updated_at,
        deleted_at,
        prescription:prescriptions(
          prescription_number,
          patient:patients(id, full_name, mr_number),
          admission:admissions(id, admission_number, ward, bed_number)
        ),
        dispenser:profiles!dispensed_by(full_name),
        items:dispensing_items(
          id,
          dispensing_record_id,
          prescription_item_id,
          medicine_batch_id,
          dispensed_medicine_id,
          quantity_dispensed,
          unit_price,
          total_price,
          created_at,
          batch:medicine_batches(batch_number, expiry_date),
          medicine:medicines(name, strength, dosage_form)
        )
      `,
        { count: 'exact' },
      )
      .order('dispensed_at', { ascending: false });

    if (params.status === 'completed') {
      query = query.is('deleted_at', null);
    } else if (params.status === 'reversed') {
      query = query.not('deleted_at', 'is', null);
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) {
      throw new Error(`Database error fetching dispensing records: ${error.message}`);
    }

    if (data) {
      const rows = data as unknown as SupabaseDispensingRow[];
      const records: DispensingWithDetails[] = rows.map((row) => {
        const rx = row.prescription;
        const patient = rx?.patient;
        const admission = rx?.admission;
        const dispenser = row.dispenser;

        const items: DispensingItemDetail[] = (row.items || []).map((it) => ({
          id: it.id,
          dispensing_record_id: it.dispensing_record_id,
          prescription_item_id: it.prescription_item_id,
          medicine_batch_id: it.medicine_batch_id,
          dispensed_medicine_id: it.dispensed_medicine_id,
          quantity_dispensed: it.quantity_dispensed,
          unit_price: Number(it.unit_price || 0),
          total_price: Number(it.total_price || 0),
          created_at: it.created_at,
          prescribed_medicine_name: it.medicine?.name || 'Prescribed Medicine',
          dispensed_medicine_name: it.medicine?.name || 'Dispensed Medicine',
          strength: it.medicine?.strength || '',
          dosage_form: it.medicine?.dosage_form || '',
          batch_number: it.batch?.batch_number || 'BATCH-UNKNOWN',
          expiry_date: it.batch?.expiry_date || '',
          is_substitution: false,
          substitution_reason: null,
          is_fefo_override: false,
          fefo_override_reason: null,
        }));

        const totalAmount = items.reduce((sum, it) => sum + it.total_price, 0);

        return {
          id: row.id,
          dispensing_number: row.dispensing_number,
          prescription_id: row.prescription_id,
          prescription_number: rx?.prescription_number || '',
          patient_id: patient?.id || '',
          patient_name: patient?.full_name || 'Unknown Patient',
          mr_number: patient?.mr_number || '',
          admission_id: admission?.id || null,
          admission_number: admission?.admission_number || null,
          ward: admission?.ward || null,
          bed_number: admission?.bed_number || null,
          dispensed_by: row.dispensed_by,
          dispensed_by_name: dispenser?.full_name || 'Staff Pharmacist',
          dispensed_at: row.dispensed_at,
          notes: row.notes,
          status: row.deleted_at ? 'reversed' : 'completed',
          total_amount: totalAmount,
          total_items: items.length,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
          items,
        };
      });

      const total = count || 0;
      return {
        records,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        isLiveDatabase: true,
      };
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return dispensingStore.getDispensingRecords(params);
}

export async function fetchDispensingById(id: string): Promise<DispensingWithDetails | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (!supabase) throw new Error('Supabase client unavailable');
    const { data, error } = await supabase
      .from('dispensing_records')
      .select(
        `
        id,
        dispensing_number,
        prescription_id,
        dispensed_by,
        dispensed_at,
        notes,
        created_at,
        updated_at,
        deleted_at,
        prescription:prescriptions(
          prescription_number,
          patient:patients(id, full_name, mr_number),
          admission:admissions(id, admission_number, ward, bed_number)
        ),
        dispenser:profiles!dispensed_by(full_name),
        items:dispensing_items(
          id,
          dispensing_record_id,
          prescription_item_id,
          medicine_batch_id,
          dispensed_medicine_id,
          quantity_dispensed,
          unit_price,
          total_price,
          created_at,
          batch:medicine_batches(batch_number, expiry_date),
          medicine:medicines(name, strength, dosage_form)
        )
      `,
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error fetching dispensing record ${id}: ${error.message}`);
    }

    if (data) {
      const row = data as unknown as SupabaseDispensingRow;
      const rx = row.prescription;
      const patient = rx?.patient;
      const admission = rx?.admission;
      const dispenser = row.dispenser;

      const items: DispensingItemDetail[] = (row.items || []).map((it) => ({
        id: it.id,
        dispensing_record_id: it.dispensing_record_id,
        prescription_item_id: it.prescription_item_id,
        medicine_batch_id: it.medicine_batch_id,
        dispensed_medicine_id: it.dispensed_medicine_id,
        quantity_dispensed: it.quantity_dispensed,
        unit_price: Number(it.unit_price || 0),
        total_price: Number(it.total_price || 0),
        created_at: it.created_at,
        prescribed_medicine_name: it.medicine?.name || 'Prescribed Medicine',
        dispensed_medicine_name: it.medicine?.name || 'Dispensed Medicine',
        strength: it.medicine?.strength || '',
        dosage_form: it.medicine?.dosage_form || '',
        batch_number: it.batch?.batch_number || 'BATCH-UNKNOWN',
        expiry_date: it.batch?.expiry_date || '',
        is_substitution: false,
        substitution_reason: null,
        is_fefo_override: false,
        fefo_override_reason: null,
      }));

      const totalAmount = items.reduce((sum, it) => sum + it.total_price, 0);

      return {
        id: row.id,
        dispensing_number: row.dispensing_number,
        prescription_id: row.prescription_id,
        prescription_number: rx?.prescription_number || '',
        patient_id: patient?.id || '',
        patient_name: patient?.full_name || 'Unknown Patient',
        mr_number: patient?.mr_number || '',
        admission_id: admission?.id || null,
        admission_number: admission?.admission_number || null,
        ward: admission?.ward || null,
        bed_number: admission?.bed_number || null,
        dispensed_by: row.dispensed_by,
        dispensed_by_name: dispenser?.full_name || 'Staff Pharmacist',
        dispensed_at: row.dispensed_at,
        notes: row.notes,
        status: row.deleted_at ? 'reversed' : 'completed',
        total_amount: totalAmount,
        total_items: items.length,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
        items,
      };
    }
    return null;
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return dispensingStore.getDispensingById(id);
}

export async function fetchDispensingKPIs(): Promise<DispensingOverviewKPIs> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [todayRecordsRes, pendingRxRes, partialRxRes, reversedRes] = await Promise.all([
        supabase
          .from('dispensing_records')
          .select('id, items:dispensing_items(quantity_dispensed)')
          .gte('dispensed_at', todayIso)
          .is('deleted_at', null),
        supabase
          .from('prescriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .is('deleted_at', null),
        supabase
          .from('prescriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'partially_dispensed')
          .is('deleted_at', null),
        supabase
          .from('dispensing_records')
          .select('id', { count: 'exact', head: true })
          .not('deleted_at', 'is', null),
      ]);

      if (todayRecordsRes.error) {
        throw new Error(
          `Database error fetching dispensing KPIs: ${todayRecordsRes.error.message}`,
        );
      }

      type RecordWithItemQty = { id: string; items?: Array<{ quantity_dispensed: number }> };
      const records = (todayRecordsRes.data || []) as unknown as RecordWithItemQty[];
      const totalDispensedToday = records.length;
      let totalUnitsDispensedToday = 0;
      records.forEach((r) => {
        (r.items || []).forEach((it) => {
          totalUnitsDispensedToday += Number(it.quantity_dispensed || 0);
        });
      });

      return {
        total_dispensed_today: totalDispensedToday,
        total_units_dispensed_today: totalUnitsDispensedToday,
        pending_prescriptions_count: pendingRxRes.count || 0,
        partially_dispensed_count: partialRxRes.count || 0,
        reversed_dispensations_count: reversedRes.count || 0,
      };
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return dispensingStore.getOverviewKPIs();
}
