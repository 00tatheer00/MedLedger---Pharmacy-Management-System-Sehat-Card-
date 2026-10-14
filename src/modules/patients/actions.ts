'use server';

import { createPatientSchema, updatePatientSchema } from './validation';
import { PatientWithRelations, CreatePatientInput, UpdatePatientInput } from './types';
import { checkMrNumberExists, getPatientById, getPatients } from './server-queries';
import { PatientPrototypeStore } from './prototype-store';
import { isSupabaseConfigured } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { getCurrentUser } from '@/core/auth/session';
import { requirePermission } from '@/core/authorization/authorize';
import { auditLogger } from '@/core/audit/audit-logger';
import { ActionResult, successResult, errorResult } from '@/core/errors/types';

/**
 * Server Action: Register a new patient.
 * Enforces server-side authorization and unique MR number constraint.
 */
export async function createPatientAction(
  rawInput: unknown,
): Promise<ActionResult<PatientWithRelations>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'patients:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = createPatientSchema.safeParse(rawInput);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return errorResult('VALIDATION_ERROR', `${issue.path.join('.')}: ${issue.message}`);
    }

    const input: CreatePatientInput = validation.data;

    // Check duplicate MR number
    const isDuplicate = await checkMrNumberExists(input.mr_number);
    if (isDuplicate) {
      return errorResult(
        'CONFLICT',
        `Medical Record Number (MRN) "${input.mr_number}" is already registered.`,
      );
    }

    let createdPatient: PatientWithRelations;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) {
        return errorResult('INTERNAL_ERROR', 'Database client unavailable.');
      }

      const { data, error } = await supabase
        .from('patients')
        .insert({
          mr_number: input.mr_number.trim().toUpperCase(),
          full_name: input.full_name.trim(),
          father_name: input.father_name?.trim() || null,
          cnic: input.cnic?.trim() || null,
          date_of_birth: input.date_of_birth || null,
          gender: input.gender,
          phone: input.phone?.trim() || null,
          address: input.address?.trim() || null,
        })
        .select('*')
        .single();

      if (error || !data) {
        return errorResult('INTERNAL_ERROR', error?.message || 'Failed to save patient record.');
      }

      createdPatient = {
        ...data,
        admissionCount: 0,
        prescriptionCount: 0,
        admissions: [],
        prescriptions: [],
      };
    } else {
      createdPatient = PatientPrototypeStore.create(input);
    }

    await auditLogger.log({
      eventType: 'patient:create',
      entityType: 'patients',
      entityId: createdPatient.id,
      userId: user?.id || null,
      action: 'create',
      newValues: {
        mrNumber: createdPatient.mr_number,
        fullName: createdPatient.full_name,
        gender: createdPatient.gender,
      },
    });

    return successResult(createdPatient);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error during patient creation.';
    return errorResult('INTERNAL_ERROR', msg);
  }
}

/**
 * Server Action: Update patient demographic records.
 */
export async function updatePatientAction(
  id: string,
  rawInput: unknown,
): Promise<ActionResult<PatientWithRelations>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'patients:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = updatePatientSchema.safeParse(rawInput);
    if (!validation.success) {
      return errorResult('VALIDATION_ERROR', validation.error.issues[0].message);
    }

    const input: UpdatePatientInput = validation.data;
    const existing = await getPatientById(id);
    if (!existing) {
      return errorResult('NOT_FOUND', 'Patient record not found.');
    }

    let updatedPatient: PatientWithRelations;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) return errorResult('INTERNAL_ERROR', 'Database unavailable.');

      const { data, error } = await supabase
        .from('patients')
        .update({
          full_name: input.full_name?.trim() ?? existing.full_name,
          father_name:
            input.father_name !== undefined
              ? input.father_name?.trim() || null
              : existing.father_name,
          cnic: input.cnic !== undefined ? input.cnic?.trim() || null : existing.cnic,
          date_of_birth:
            input.date_of_birth !== undefined
              ? input.date_of_birth || null
              : existing.date_of_birth,
          gender: input.gender ?? existing.gender,
          phone: input.phone !== undefined ? input.phone?.trim() || null : existing.phone,
          address: input.address !== undefined ? input.address?.trim() || null : existing.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        return errorResult('INTERNAL_ERROR', error?.message || 'Failed to update patient.');
      }

      updatedPatient = {
        ...data,
        admissions: existing.admissions,
        prescriptions: existing.prescriptions,
        admissionCount: existing.admissionCount,
        prescriptionCount: existing.prescriptionCount,
      };
    } else {
      const updated = PatientPrototypeStore.update(id, input);
      if (!updated) {
        return errorResult('NOT_FOUND', 'Patient not found in prototype store.');
      }
      updatedPatient = updated;
    }

    await auditLogger.log({
      eventType: 'patient:update',
      entityType: 'patients',
      entityId: id,
      userId: user?.id || null,
      action: 'update',
      newValues: {
        mrNumber: updatedPatient.mr_number,
        fullName: updatedPatient.full_name,
      },
    });

    return successResult(updatedPatient);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Update operation failed.';
    return errorResult('INTERNAL_ERROR', msg);
  }
}

/**
 * Server Action: Search patients by query for dropdown selectors and autocomplete.
 */
export async function searchPatientsAction(
  query: string,
): Promise<ActionResult<PatientWithRelations[]>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'patients:read');
    if (!authCheck.success) {
      return authCheck;
    }

    const trimmed = (query || '').trim();
    if (!trimmed) {
      const res = await getPatients({ pageSize: 10 });
      return successResult(res.patients);
    }

    const res = await getPatients({ search: trimmed, pageSize: 20 });
    return successResult(res.patients);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed.';
    return errorResult('INTERNAL_ERROR', msg);
  }
}
