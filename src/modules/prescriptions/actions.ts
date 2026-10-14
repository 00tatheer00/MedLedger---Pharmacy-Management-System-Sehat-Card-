'use server';

import { createPrescriptionSchema } from './validation';
import {
  PrescriptionWithDetails,
  PrescriptionItemWithMedicine,
  CreatePrescriptionInput,
} from './types';
import { checkPrescriptionNumberExists, getPrescriptionById } from './server-queries';
import { PrescriptionPrototypeStore } from './prototype-store';
import { PatientPrototypeStore } from '../patients/prototype-store';
import { AdmissionPrototypeStore } from '../admissions/prototype-store';
import { isSupabaseConfigured } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { getCurrentUser } from '@/core/auth/session';
import { requirePermission } from '@/core/authorization/authorize';
import { auditLogger } from '@/core/audit/audit-logger';
import { ActionResult, successResult, errorResult } from '@/core/errors/types';

/**
 * Server Action: Record a paper prescription transcribed by the pharmacy.
 *
 * CRITICAL INVARIANT:
 * Recording a prescription records the clinician's order ONLY.
 * It DOES NOT deduct inventory, modify batch balances, or generate
 * stock movements. Stock allocation and deduction occur strictly in Phase 9
 * at the physical dispensing counter.
 */
export async function createPrescriptionAction(
  rawInput: unknown,
): Promise<ActionResult<PrescriptionWithDetails>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'prescriptions:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = createPrescriptionSchema.safeParse(rawInput);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return errorResult('VALIDATION_ERROR', `${issue.path.join('.')}: ${issue.message}`);
    }

    const input: CreatePrescriptionInput = validation.data;

    // Check duplicate prescription number
    const isDuplicate = await checkPrescriptionNumberExists(input.prescription_number);
    if (isDuplicate) {
      return errorResult(
        'CONFLICT',
        `Prescription number "${input.prescription_number}" is already registered.`,
      );
    }

    // Lookup patient
    const patient = PatientPrototypeStore.getById(input.patient_id);
    if (!patient && !isSupabaseConfigured()) {
      return errorResult('NOT_FOUND', 'Selected patient does not exist.');
    }

    // Lookup optional admission
    const admission = input.admission_id
      ? AdmissionPrototypeStore.getById(input.admission_id)
      : null;

    let createdPrescription: PrescriptionWithDetails;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) {
        return errorResult('INTERNAL_ERROR', 'Database client unavailable.');
      }

      // Step 1: Insert prescription header
      const { data: rxHeader, error: rxError } = await supabase
        .from('prescriptions')
        .insert({
          prescription_number: input.prescription_number.trim().toUpperCase(),
          patient_id: input.patient_id,
          admission_id: input.admission_id || null,
          prescriber_name: input.prescriber_name.trim(),
          prescription_date: input.prescription_date,
          status: 'pending',
          notes: input.notes?.trim() || null,
          created_by: user?.id || 'usr-pharmacist-001',
        })
        .select('*')
        .single();

      if (rxError || !rxHeader) {
        return errorResult(
          'INTERNAL_ERROR',
          rxError?.message || 'Failed to record prescription header.',
        );
      }

      // Step 2: Insert prescription line items atomically (with dispensed_quantity = 0)
      const lineItemsPayload = input.items.map((it) => ({
        prescription_id: rxHeader.id,
        medicine_id: it.medicine_id,
        prescribed_quantity: it.prescribed_quantity,
        dispensed_quantity: 0, // Invariant: no stock issued
        dosage_instructions: it.dosage_instructions?.trim() || null,
        status: 'pending',
        notes: it.notes?.trim() || null,
      }));

      const { data: itemRows, error: itemsError } = await supabase
        .from('prescription_items')
        .insert(lineItemsPayload)
        .select('*, medicines(*)');

      if (itemsError || !itemRows) {
        // Rollback header if items fail
        await supabase.from('prescriptions').delete().eq('id', rxHeader.id);
        return errorResult(
          'INTERNAL_ERROR',
          itemsError?.message || 'Failed to record prescription items.',
        );
      }

      const patientSummary = patient
        ? {
            id: patient.id,
            mr_number: patient.mr_number,
            full_name: patient.full_name,
            gender: patient.gender,
            phone: patient.phone,
            cnic: patient.cnic,
          }
        : {
            id: input.patient_id,
            mr_number: 'MRN-PENDING',
            full_name: 'Patient Record',
            gender: 'other',
          };

      const admissionSummary = admission
        ? {
            id: admission.id,
            admission_number: admission.admission_number,
            ward: admission.ward,
            bed_number: admission.bed_number,
            status: admission.status,
          }
        : null;

      createdPrescription = {
        ...rxHeader,
        patient: patientSummary,
        admission: admissionSummary,
        items: (itemRows as Array<Record<string, unknown>>).map((it) => ({
          ...(it as unknown as PrescriptionItemWithMedicine),
          medicine: (it.medicines as unknown as PrescriptionItemWithMedicine['medicine']) || null,
        })),
      };
    } else {
      const patientSummary = {
        id: patient!.id,
        mr_number: patient!.mr_number,
        full_name: patient!.full_name,
        gender: patient!.gender,
        phone: patient!.phone,
        cnic: patient!.cnic,
      };

      const admissionSummary = admission
        ? {
            id: admission.id,
            admission_number: admission.admission_number,
            ward: admission.ward,
            bed_number: admission.bed_number,
            status: admission.status,
          }
        : null;

      createdPrescription = PrescriptionPrototypeStore.create(
        input,
        patientSummary,
        admissionSummary,
      );
    }

    await auditLogger.log({
      eventType: 'prescription:transcribe',
      entityType: 'prescriptions',
      entityId: createdPrescription.id,
      userId: user?.id || null,
      action: 'create',
      newValues: {
        prescriptionNumber: createdPrescription.prescription_number,
        patientId: createdPrescription.patient_id,
        prescriberName: createdPrescription.prescriber_name,
        itemCount: createdPrescription.items.length,
      },
    });

    return successResult(createdPrescription);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Unexpected error during prescription creation.';
    return errorResult('INTERNAL_ERROR', msg);
  }
}

/**
 * Server Action: Cancel a pending prescription.
 */
export async function cancelPrescriptionAction(
  id: string,
  reason: string = 'Cancelled by clinician/pharmacist',
): Promise<ActionResult<PrescriptionWithDetails>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'prescriptions:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    const existing = await getPrescriptionById(id);
    if (!existing) {
      return errorResult('NOT_FOUND', 'Prescription not found.');
    }

    if (existing.status !== 'pending') {
      return errorResult(
        'VALIDATION_ERROR',
        `Cannot cancel prescription with status "${existing.status}". Only pending prescriptions can be cancelled.`,
      );
    }

    let cancelledRx: PrescriptionWithDetails;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (!supabase) return errorResult('INTERNAL_ERROR', 'Database unavailable.');

      const { data, error } = await supabase
        .from('prescriptions')
        .update({
          status: 'cancelled',
          notes: `${existing.notes || ''} [Cancelled: ${reason}]`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, patients(*), admissions(*), prescription_items(*, medicines(*))')
        .single();

      if (error || !data) {
        return errorResult('INTERNAL_ERROR', error?.message || 'Failed to cancel prescription.');
      }

      cancelledRx = {
        ...data,
        patient: data.patients,
        admission: data.admissions || null,
        items: ((data.prescription_items as Array<Record<string, unknown>>) || []).map((it) => ({
          ...(it as unknown as PrescriptionItemWithMedicine),
          medicine: (it.medicines as unknown as PrescriptionItemWithMedicine['medicine']) || null,
        })),
      };
    } else {
      const cancelled = PrescriptionPrototypeStore.cancel(id, reason);
      if (!cancelled) {
        return errorResult('NOT_FOUND', 'Prescription not found in prototype store.');
      }
      cancelledRx = cancelled;
    }

    await auditLogger.log({
      eventType: 'prescription:cancel',
      entityType: 'prescriptions',
      entityId: id,
      userId: user?.id || null,
      action: 'update',
      newValues: {
        prescriptionNumber: cancelledRx.prescription_number,
        reason,
      },
    });

    return successResult(cancelledRx);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cancellation operation failed.';
    return errorResult('INTERNAL_ERROR', msg);
  }
}
