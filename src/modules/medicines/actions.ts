'use server';

import { createMedicineSchema, updateMedicineSchema, medicineFilterSchema } from './validation';
import {
  Medicine,
  MedicineWithStockSummary,
  MedicineFilters,
  MedicinePaginationParams,
  PaginatedMedicinesResult,
  CreateMedicineInput,
  UpdateMedicineInput,
} from './types';
import {
  getMedicines as queryMedicines,
  getMedicineById as queryMedicineById,
} from './server-queries';
import { medicineStore } from './prototype-store';
import { isSupabaseConfigured } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { getCurrentUser } from '@/core/auth/session';
import { requirePermission } from '@/core/authorization/authorize';
import { auditLogger } from '@/core/audit/audit-logger';
import { ActionResult, successResult, errorResult } from '@/core/errors/types';

/**
 * Server Action: Fetch paginated medicines catalogue.
 */
export async function getMedicinesAction(
  filters: MedicineFilters = {},
  pagination: MedicinePaginationParams = {},
): Promise<ActionResult<PaginatedMedicinesResult>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'medicines:read');
    if (!authCheck.success) {
      return authCheck;
    }

    const validatedFilters = medicineFilterSchema.safeParse({ ...filters, ...pagination });
    if (!validatedFilters.success) {
      return errorResult('VALIDATION_ERROR', 'Invalid search parameters or filters.');
    }

    const result = await queryMedicines(filters, pagination);
    return successResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to query medicines catalogue';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Get single medicine by ID.
 */
export async function getMedicineByIdAction(
  id: string,
): Promise<ActionResult<MedicineWithStockSummary>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'medicines:read');
    if (!authCheck.success) {
      return authCheck;
    }

    const medicine = await queryMedicineById(id);
    if (!medicine) {
      return errorResult('NOT_FOUND', `Medicine with ID "${id}" was not found.`);
    }

    return successResult(medicine);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve medicine';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Register a new medicine in the catalogue.
 */
export async function createMedicineAction(rawInput: unknown): Promise<ActionResult<Medicine>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'medicines:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = createMedicineSchema.safeParse(rawInput);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return errorResult('VALIDATION_ERROR', `${issue.path.join('.')}: ${issue.message}`);
    }

    const input: CreateMedicineInput = validation.data;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('medicines')
          .insert({
            item_code: input.item_code || null,
            name: input.name,
            generic_name: input.generic_name,
            dosage_form: input.dosage_form,
            strength: input.strength,
            unit_of_measure: input.unit_of_measure,
            category: input.category,
            min_threshold: input.min_threshold ?? 20,
            is_active: input.is_active ?? true,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return errorResult(
              'CONFLICT',
              `A medicine with name "${input.name}" and strength "${input.strength}" already exists.`,
            );
          }
          return errorResult('INTERNAL_ERROR', error.message);
        }

        await auditLogger.log({
          eventType: 'medicines:created',
          entityType: 'medicines',
          entityId: data.id,
          action: 'create',
          userId: user?.id || null,
          newValues: { name: data.name, strength: data.strength },
        });

        return successResult(data);
      }
    }

    const created = medicineStore.createMedicine(input);

    await auditLogger.log({
      eventType: 'medicines:created',
      entityType: 'medicines',
      entityId: created.id,
      action: 'create',
      userId: user?.id || 'prototype-user',
      newValues: { name: created.name, strength: created.strength },
    });

    return successResult(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to register medicine';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Update medicine details.
 */
export async function updateMedicineAction(
  id: string,
  rawInput: unknown,
): Promise<ActionResult<Medicine>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'medicines:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = updateMedicineSchema.safeParse(rawInput);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return errorResult('VALIDATION_ERROR', `${issue.path.join('.')}: ${issue.message}`);
    }

    const input: UpdateMedicineInput = validation.data;

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('medicines')
          .update({
            ...(input.item_code !== undefined && { item_code: input.item_code || null }),
            ...(input.name && { name: input.name }),
            ...(input.generic_name && { generic_name: input.generic_name }),
            ...(input.dosage_form && { dosage_form: input.dosage_form }),
            ...(input.strength && { strength: input.strength }),
            ...(input.unit_of_measure && { unit_of_measure: input.unit_of_measure }),
            ...(input.category && { category: input.category }),
            ...(input.min_threshold !== undefined && { min_threshold: input.min_threshold }),
            ...(input.is_active !== undefined && { is_active: input.is_active }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return errorResult(
              'CONFLICT',
              'Another medicine with this name and strength already exists.',
            );
          }
          return errorResult('INTERNAL_ERROR', error.message);
        }

        await auditLogger.log({
          eventType: 'medicines:updated',
          entityType: 'medicines',
          entityId: data.id,
          action: 'update',
          userId: user?.id || null,
          newValues: { changes: Object.keys(input) },
        });

        return successResult(data);
      }
    }

    const updated = medicineStore.updateMedicine(id, input);

    await auditLogger.log({
      eventType: 'medicines:updated',
      entityType: 'medicines',
      entityId: updated.id,
      action: 'update',
      userId: user?.id || 'prototype-user',
      newValues: { changes: Object.keys(input) },
    });

    return successResult(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update medicine';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Toggle active / inactive status of a medicine.
 */
export async function toggleMedicineStatusAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult<Medicine>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'medicines:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('medicines')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) return errorResult('INTERNAL_ERROR', error.message);

        await auditLogger.log({
          eventType: 'medicines:status_toggled',
          entityType: 'medicines',
          entityId: id,
          action: 'update',
          userId: user?.id || null,
          newValues: { is_active: isActive, reason: 'Status toggle' },
        });

        return successResult(data);
      }
    }

    const updated = medicineStore.toggleStatus(id, isActive);

    await auditLogger.log({
      eventType: 'medicines:status_toggled',
      entityType: 'medicines',
      entityId: id,
      action: 'update',
      userId: user?.id || 'prototype-user',
      newValues: { is_active: isActive, reason: 'Status toggle' },
    });

    return successResult(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update medicine status';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Soft delete a medicine from the catalogue.
 */
export async function deleteMedicineAction(
  id: string,
): Promise<ActionResult<{ success: boolean; id: string }>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'medicines:manage');
    if (!authCheck.success) {
      return authCheck;
    }

    if (isSupabaseConfigured()) {
      const supabase = await createServerClient();
      if (supabase) {
        const { error } = await supabase
          .from('medicines')
          .update({
            is_active: false,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) return errorResult('INTERNAL_ERROR', error.message);

        await auditLogger.log({
          eventType: 'medicines:deleted',
          entityType: 'medicines',
          entityId: id,
          action: 'delete',
          userId: user?.id || null,
        });

        return successResult({ success: true, id });
      }
    }

    medicineStore.deleteMedicine(id);

    await auditLogger.log({
      eventType: 'medicines:deleted',
      entityType: 'medicines',
      entityId: id,
      action: 'delete',
      userId: user?.id || 'prototype-user',
    });

    return successResult({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete medicine';
    return errorResult('INTERNAL_ERROR', message);
  }
}
