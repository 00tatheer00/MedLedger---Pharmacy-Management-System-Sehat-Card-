'use server';

/**
 * MedLedger — Supplier Server Actions
 *
 * Implements server-side actions for supplier listing, registration, updates,
 * and status toggling with RBAC enforcement and audit logging.
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/core/auth';
import { requirePermission } from '@/core/authorization';
import { auditLogger } from '@/core/audit';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierFilterSchema,
  CreateSupplierSchemaType,
  UpdateSupplierSchemaType,
} from './validation';
import { supplierStore } from './prototype-store';
import { getSuppliers, getSupplierById } from './server-queries';
import { PaginatedSuppliersResponse, SupplierWithStats } from './types';

export async function getSuppliersAction(
  rawFilters: unknown = {},
): Promise<{ success: boolean; data?: PaginatedSuppliersResponse; error?: string }> {
  try {
    const parsed = supplierFilterSchema.safeParse(rawFilters);
    const filters = parsed.success ? parsed.data : {};
    const res = await getSuppliers(filters);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve suppliers.',
    };
  }
}

export async function getSupplierByIdAction(
  id: string,
): Promise<{ success: boolean; data?: SupplierWithStats; error?: string }> {
  try {
    const supplier = await getSupplierById(id);
    if (!supplier) {
      return { success: false, error: 'Supplier not found.' };
    }
    return { success: true, data: supplier };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve supplier.',
    };
  }
}

export async function createSupplierAction(rawData: CreateSupplierSchemaType): Promise<{
  success: boolean;
  data?: SupplierWithStats;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    const user = await getCurrentUser();
    // Requires suppliers:manage or purchasing:manage
    const authCheck = requirePermission(user, 'suppliers:manage');
    if (!authCheck.success) {
      // Fallback check purchasing:manage
      const altCheck = requirePermission(user, 'purchasing:manage');
      if (!altCheck.success) {
        return {
          success: false,
          error: 'Unauthorized: insufficient permissions to create suppliers.',
        };
      }
    }

    const validation = createSupplierSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed. Please check form inputs.',
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const actor = {
      id: user?.id || 'demo-purchasing-staff',
      name: user?.fullName || 'Purchasing Officer',
    };

    const newSupplier = supplierStore.createSupplier(validation.data, actor);

    // Audit log
    await auditLogger.log({
      eventType: 'record_created',
      entityType: 'supplier',
      entityId: newSupplier.id,
      action: 'create',
      userId: actor.id,
      newValues: { name: newSupplier.name, phone: newSupplier.phone },
    });

    revalidatePath('/suppliers');
    revalidatePath('/purchases');

    const withStats = supplierStore.getSupplierById(newSupplier.id);
    return { success: true, data: withStats || undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create supplier.',
    };
  }
}

export async function updateSupplierAction(
  id: string,
  rawData: UpdateSupplierSchemaType,
): Promise<{
  success: boolean;
  data?: SupplierWithStats;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'suppliers:manage');
    if (!authCheck.success) {
      const altCheck = requirePermission(user, 'purchasing:manage');
      if (!altCheck.success) {
        return {
          success: false,
          error: 'Unauthorized: insufficient permissions to update suppliers.',
        };
      }
    }

    const validation = updateSupplierSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed. Please check form inputs.',
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const actor = {
      id: user?.id || 'demo-purchasing-staff',
      name: user?.fullName || 'Purchasing Officer',
    };

    const updated = supplierStore.updateSupplier(id, validation.data, actor);

    await auditLogger.log({
      eventType: 'record_updated',
      entityType: 'supplier',
      entityId: updated.id,
      action: 'update',
      userId: actor.id,
      newValues: validation.data,
    });

    revalidatePath('/suppliers');
    revalidatePath(`/suppliers/${id}`);
    revalidatePath('/purchases');

    const withStats = supplierStore.getSupplierById(updated.id);
    return { success: true, data: withStats || undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update supplier.',
    };
  }
}

export async function toggleSupplierStatusAction(
  id: string,
): Promise<{ success: boolean; data?: SupplierWithStats; error?: string }> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'suppliers:manage');
    if (!authCheck.success) {
      const altCheck = requirePermission(user, 'purchasing:manage');
      if (!altCheck.success) {
        return {
          success: false,
          error: 'Unauthorized: insufficient permissions to toggle supplier status.',
        };
      }
    }

    const updated = supplierStore.toggleStatus(id);

    await auditLogger.log({
      eventType: 'status_changed',
      entityType: 'supplier',
      entityId: updated.id,
      action: 'update',
      userId: user?.id || 'system',
      newValues: { is_active: updated.is_active },
    });

    revalidatePath('/suppliers');
    revalidatePath(`/suppliers/${id}`);

    const withStats = supplierStore.getSupplierById(updated.id);
    return { success: true, data: withStats || undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to toggle supplier status.',
    };
  }
}
