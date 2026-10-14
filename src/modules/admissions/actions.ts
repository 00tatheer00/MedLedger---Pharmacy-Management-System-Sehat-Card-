'use server';

import { createAdmissionSchema, dischargeAdmissionSchema } from './validation';
import { AdmissionWithPatient, CreateAdmissionInput } from './types';
import { checkAdmissionNumberExists, getAdmissionById } from './server-queries';
import { AdmissionPrototypeStore } from './prototype-store';
import { PatientPrototypeStore } from '../patients/prototype-store';
import { isSupabaseConfigured } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { getCurrentUser } from '@/core/auth/session';
import { requirePermission } from '@/core/authorization/authorize';
import { auditLogger } from '@/core/audit/audit-logger';
import { ActionResult, successResult, errorResult } from '@/core/errors/types';

/**
 * Server Action: Record a new hospital admission for a patient.
 */
export async function createAdmissionAction(
  rawInput: unknown,
): Promise<ActionResult<AdmissionWithPatient>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'patients:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = createAdmissionSchema.safeParse(rawInput);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return errorResult('VALIDATION_ERROR', `${issue.path.join('.')}: ${issue.message}`);
    }

    const input: CreateAdmissionInput = validation.data;

    // Check patient existence
    const patient = PatientPrototypeStore.getById(input.patient_id);
    if (!patient && !isSupabaseConfigured()) {
      return errorResult('NOT_FOUND', 'Selected patient does not exist.');
    }

    // Check duplicate admission number
    const isDuplicate = await checkAdmissionNumberExists(input.admission_number);
    if (isDuplicate) {
      return errorResult(
        'CONFLICT',
        `Admission number "${input.admission_number}" is already registered.`,
      );
    }

    let createdAdmission: AdmissionWithPatient;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) {
        return errorResult('INTERNAL_ERROR', 'Database client unavailable.');
      }

      const { data, error } = await supabase
        .from('admissions')
        .insert({
          patient_id: input.patient_id,
          admission_number: input.admission_number.trim().toUpperCase(),
          admission_date: input.admission_date,
          ward: input.ward.trim(),
          bed_number: input.bed_number?.trim() || null,
          attending_doctor: input.attending_doctor?.trim() || null,
          status: input.status || 'admitted',
        })
        .select('*, patients(*)')
        .single();

      if (error || !data) {
        return errorResult('INTERNAL_ERROR', error?.message || 'Failed to save admission record.');
      }

      createdAdmission = {
        ...data,
        patient: data.patients || null,
      };
    } else {
      const created = AdmissionPrototypeStore.create(input);
      createdAdmission = {
        ...created,
        patient,
      };
    }

    await auditLogger.log({
      eventType: 'admission:create',
      entityType: 'admissions',
      entityId: createdAdmission.id,
      userId: user?.id || null,
      action: 'create',
      newValues: {
        admissionNumber: createdAdmission.admission_number,
        patientId: createdAdmission.patient_id,
        ward: createdAdmission.ward,
        bedNumber: createdAdmission.bed_number,
      },
    });

    return successResult(createdAdmission);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error during admission creation.';
    return errorResult('INTERNAL_ERROR', msg);
  }
}

/**
 * Server Action: Discharge or transfer an admitted inpatient.
 */
export async function dischargeAdmissionAction(
  admissionId: string,
  dischargeDate: string,
  status: 'discharged' | 'transferred' = 'discharged',
): Promise<ActionResult<AdmissionWithPatient>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'patients:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = dischargeAdmissionSchema.safeParse({
      discharge_date: dischargeDate,
      status,
    });
    if (!validation.success) {
      return errorResult('VALIDATION_ERROR', validation.error.issues[0].message);
    }

    const existing = await getAdmissionById(admissionId);
    if (!existing) {
      return errorResult('NOT_FOUND', 'Admission record not found.');
    }

    if (new Date(dischargeDate) < new Date(existing.admission_date)) {
      return errorResult('VALIDATION_ERROR', 'Discharge date cannot precede admission date.');
    }

    let updatedAdmission: AdmissionWithPatient;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) return errorResult('INTERNAL_ERROR', 'Database unavailable.');

      const { data, error } = await supabase
        .from('admissions')
        .update({
          discharge_date: dischargeDate,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', admissionId)
        .select('*, patients(*)')
        .single();

      if (error || !data) {
        return errorResult(
          'INTERNAL_ERROR',
          error?.message || 'Failed to update admission status.',
        );
      }

      updatedAdmission = {
        ...data,
        patient: data.patients || null,
      };
    } else {
      const updated = AdmissionPrototypeStore.update(admissionId, {
        discharge_date: dischargeDate,
        status,
      });

      if (!updated) {
        return errorResult('NOT_FOUND', 'Admission not found in prototype store.');
      }

      updatedAdmission = {
        ...updated,
        patient: existing.patient,
      };
    }

    await auditLogger.log({
      eventType: 'admission:discharge',
      entityType: 'admissions',
      entityId: admissionId,
      userId: user?.id || null,
      action: 'update',
      newValues: {
        admissionNumber: updatedAdmission.admission_number,
        dischargeDate,
        status,
      },
    });

    return successResult(updatedAdmission);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Discharge operation failed.';
    return errorResult('INTERNAL_ERROR', msg);
  }
}
