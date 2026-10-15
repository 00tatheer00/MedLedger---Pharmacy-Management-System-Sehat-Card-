'use server';

/**
 * MedLedger — Dispensing & Atomic Stock Transactions Server Actions
 *
 * Implements server-side actions for dispensing medicines against prescriptions,
 * FEFO batch querying, and authorized compensating reversals with RBAC & audit logging.
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/core/auth';
import { requirePermission } from '@/core/authorization';
import { auditLogger } from '@/core/audit';
import { isSupabaseConfigured } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { dispensePrescriptionSchema, reverseDispensingSchema } from './validation';
import { dispensingStore } from './prototype-store';
import {
  fetchEligibleBatchesForMedicine,
  fetchDispensingRecords,
  fetchDispensingById,
  fetchDispensingKPIs,
} from './server-queries';
import {
  DispensingWithDetails,
  PaginatedDispensingResult,
  FEFOBatchCandidate,
  DispensingOverviewKPIs,
  DispensingFilterParams,
} from './types';

// ==========================================
// 1. Dispense Prescription Action
// ==========================================

export async function dispensePrescriptionAction(
  rawInput: unknown,
): Promise<{ success: boolean; data?: DispensingWithDetails; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'dispensing:create');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const parsed = dispensePrescriptionSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: `${issue.path.join('.')}: ${issue.message}` };
    }

    const input = parsed.data;
    const actor = {
      id: user?.id || 'usr-pharmacist-001',
      name: user?.fullName || 'Staff Pharmacist',
    };

    let result: DispensingWithDetails;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) throw new Error('Supabase client unavailable');
      const rpcItems = input.items.map((it) => ({
        prescription_item_id: it.prescription_item_id,
        medicine_batch_id: it.medicine_batch_id,
        dispensed_medicine_id: it.dispensed_medicine_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        notes: it.notes || null,
      }));

      const { data: recordId, error: rpcError } = await supabase.rpc(
        'fn_dispense_prescription_atomic',
        {
          p_prescription_id: input.prescription_id,
          p_dispensed_by: actor.id,
          p_notes: input.notes || null,
          p_items: rpcItems,
          p_idempotency_key: input.idempotency_key,
        },
      );

      if (rpcError) {
        throw new Error(`Database transaction failed: ${rpcError.message}`);
      }

      const fetched = await fetchDispensingById(recordId);
      if (!fetched) {
        throw new Error('Dispensing transaction committed but failed to retrieve record.');
      }
      result = fetched;
    } else {
      result = dispensingStore.dispensePrescription(input, actor);
    }

    auditLogger.log({
      eventType: 'dispensing:created',
      userId: actor.id,
      entityType: 'dispensing_record',
      entityId: result.id,
      action: 'dispense',
      newValues: {
        dispensing_number: result.dispensing_number,
        prescription_id: result.prescription_id,
        prescription_number: result.prescription_number,
        patient_mrn: result.mr_number,
        item_count: result.items.length,
        total_amount: result.total_amount,
      },
    });

    revalidatePath('/dispensing');
    revalidatePath('/prescriptions');
    revalidatePath('/inventory');

    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to dispense prescription.',
    };
  }
}

// ==========================================
// 2. Reverse Dispensing Action
// ==========================================

export async function reverseDispensingAction(
  rawInput: unknown,
): Promise<{ success: boolean; data?: DispensingWithDetails; error?: string }> {
  try {
    const user = await getCurrentUser();
    // Reversal is restricted to Pharmacy Managers and System Admins
    const authCheck = requirePermission(user, 'dispensing:create');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const parsed = reverseDispensingSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: `${issue.path.join('.')}: ${issue.message}` };
    }

    const input = parsed.data;
    const actor = {
      id: user?.id || 'usr-manager-001',
      name: user?.fullName || 'Pharmacy Manager',
    };

    let result: DispensingWithDetails;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) throw new Error('Supabase client unavailable');
      const { error: rpcError } = await supabase.rpc('fn_reverse_dispensing_atomic', {
        p_dispensing_record_id: input.dispensing_record_id,
        p_reversed_by: actor.id,
        p_reason: input.reason,
      });

      if (rpcError) {
        throw new Error(`Database reversal transaction failed: ${rpcError.message}`);
      }

      const fetched = await fetchDispensingById(input.dispensing_record_id);
      if (!fetched) {
        throw new Error('Reversal transaction committed but failed to retrieve record.');
      }
      result = fetched;
    } else {
      result = dispensingStore.reverseDispensing(input, actor);
    }

    auditLogger.log({
      eventType: 'dispensing:reversed',
      userId: actor.id,
      entityType: 'dispensing_record',
      entityId: result.id,
      action: 'update',
      newValues: {
        dispensing_number: result.dispensing_number,
        prescription_id: result.prescription_id,
        reason: input.reason,
      },
    });

    revalidatePath('/dispensing');
    revalidatePath('/prescriptions');
    revalidatePath('/inventory');

    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reverse dispensing record.',
    };
  }
}

// ==========================================
// 3. Eligible Batches Query Action
// ==========================================

export async function getEligibleBatchesForMedicineAction(
  medicineId: string,
): Promise<{ success: boolean; data?: FEFOBatchCandidate[]; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'dispensing:read');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const batches = await fetchEligibleBatchesForMedicine(medicineId);
    return { success: true, data: batches };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to load medicine batches.',
    };
  }
}

// ==========================================
// 4. Dispensing Records Query Action
// ==========================================

export async function getDispensingRecordsAction(
  rawFilters: unknown = {},
): Promise<{ success: boolean; data?: PaginatedDispensingResult; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'dispensing:read');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const res = await fetchDispensingRecords((rawFilters as DispensingFilterParams) || {});
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve dispensing records.',
    };
  }
}

// ==========================================
// 5. Dispensing Detail Query Action
// ==========================================

export async function getDispensingDetailAction(
  id: string,
): Promise<{ success: boolean; data?: DispensingWithDetails | null; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'dispensing:read');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const record = await fetchDispensingById(id);
    return { success: true, data: record };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve dispensing record.',
    };
  }
}

// ==========================================
// 6. Dispensing KPIs Query Action
// ==========================================

export async function getDispensingKPIsAction(): Promise<{
  success: boolean;
  data?: DispensingOverviewKPIs;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'dispensing:read');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    const kpis = await fetchDispensingKPIs();
    return { success: true, data: kpis };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve dispensing KPIs.',
    };
  }
}

// ==========================================
// 7. Fast 1-Screen Quick Dispense Requisition Action
// ==========================================

export interface QuickDispensePayload {
  ssp_visit_no?: string | null;
  patient_name: string;
  mr_number?: string | null;
  ward: string;
  bed_number?: string | null;
  prescriber_name?: string | null;
  notes?: string | null;
  items: {
    medicine_id: string;
    quantity: number;
    unit_price?: number;
  }[];
}

export async function quickDispenseRequisitionAction(
  payload: QuickDispensePayload,
): Promise<{ success: boolean; data?: DispensingWithDetails; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'dispensing:create');
    if (!authCheck.success) {
      return { success: false, error: authCheck.error.message };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'At least one medicine or consumable item must be added.' };
    }

    const actor = {
      id: user?.id || 'usr-pharmacist-001',
      name: user?.fullName || 'Staff Pharmacist',
    };

    const record = dispensingStore.quickDispensePaperRequisition(payload, actor);
    revalidatePath('/dispensing');
    revalidatePath('/admissions');
    revalidatePath('/claims');
    return { success: true, data: record };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to process quick dispensing.',
    };
  }
}
