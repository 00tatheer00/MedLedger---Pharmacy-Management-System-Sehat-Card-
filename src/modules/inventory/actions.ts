'use server';

import {
  createOpeningBatchSchema,
  stockAdjustmentSchema,
  batchFilterSchema,
  movementFilterSchema,
} from './validation';
import {
  MedicineBatch,
  StockMovement,
  BatchFilters,
  MovementFilters,
  StockAdjustmentInput,
  CreateOpeningBatchInput,
  InventoryOverviewSummary,
  InventoryAlert,
} from './types';
import {
  getInventoryOverview as queryOverview,
  getBatches as queryBatches,
  getStockMovements as queryMovements,
  getInventoryAlerts as queryAlerts,
} from './server-queries';
import { inventoryStore } from './prototype-store';
import { getCurrentUser } from '@/core/auth/session';
import { requirePermission } from '@/core/authorization/authorize';
import { auditLogger } from '@/core/audit/audit-logger';
import { ActionResult, successResult, errorResult } from '@/core/errors/types';

/**
 * Server Action: Fetch warehouse overview metrics.
 */
export async function getInventoryOverviewAction(): Promise<
  ActionResult<InventoryOverviewSummary>
> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'inventory:read');
    if (!authCheck.success) {
      return authCheck;
    }

    const summary = await queryOverview();
    return successResult(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve inventory overview';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Fetch batches list with filters.
 */
export async function getBatchesAction(filters: BatchFilters = {}): Promise<
  ActionResult<{
    batches: (MedicineBatch & {
      medicine_name?: string;
      strength?: string;
      dosage_form?: string;
    })[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    isLiveDatabase: boolean;
  }>
> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'inventory:read');
    if (!authCheck.success) {
      return authCheck;
    }

    const validatedFilters = batchFilterSchema.safeParse(filters);
    if (!validatedFilters.success) {
      return errorResult('VALIDATION_ERROR', 'Invalid batch filter parameters.');
    }

    const result = await queryBatches(filters);
    return successResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to query batches';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Fetch stock movements audit ledger.
 */
export async function getStockMovementsAction(filters: MovementFilters = {}): Promise<
  ActionResult<{
    movements: StockMovement[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    isLiveDatabase: boolean;
  }>
> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'inventory:read');
    if (!authCheck.success) {
      return authCheck;
    }

    const validatedFilters = movementFilterSchema.safeParse(filters);
    if (!validatedFilters.success) {
      return errorResult('VALIDATION_ERROR', 'Invalid stock movement filter parameters.');
    }

    const result = await queryMovements(filters);
    return successResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to query stock movements';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Fetch active inventory alerts.
 */
export async function getInventoryAlertsAction(): Promise<ActionResult<InventoryAlert[]>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'inventory:read');
    if (!authCheck.success) {
      return authCheck;
    }

    const alerts = await queryAlerts();
    return successResult(alerts);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to query inventory alerts';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Record opening balance stock intake for a medicine.
 */
export async function createOpeningBatchAction(
  rawInput: unknown,
): Promise<ActionResult<MedicineBatch>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'inventory:adjust');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = createOpeningBatchSchema.safeParse(rawInput);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return errorResult('VALIDATION_ERROR', `${issue.path.join('.')}: ${issue.message}`);
    }

    const input: CreateOpeningBatchInput = validation.data;
    const actor = {
      id: user?.id || 'usr-pharmacist-001',
      name: user?.fullName || 'Authorized Staff Pharmacist',
    };

    const batch = inventoryStore.createOpeningBatch(input, actor);

    await auditLogger.log({
      eventType: 'inventory:batch_created',
      entityType: 'medicine_batches',
      entityId: batch.id,
      action: 'create',
      userId: actor.id,
      newValues: {
        batch_number: batch.batch_number,
        medicine_id: batch.medicine_id,
        quantity: batch.quantity_on_hand,
        operation: 'opening_balance',
      },
    });

    return successResult(batch);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record opening batch';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Record an authorized inventory adjustment.
 *
 * CRITICAL INVARIANT:
 * Direct edits to stock are prohibited. Every balance update MUST record an
 * immutable compensatory StockMovement row. Negative stock balances are strictly blocked.
 */
export async function recordStockAdjustmentAction(
  rawInput: unknown,
): Promise<ActionResult<{ batch: MedicineBatch; movement: StockMovement }>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'inventory:adjust');
    if (!authCheck.success) {
      return authCheck;
    }

    const validation = stockAdjustmentSchema.safeParse(rawInput);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return errorResult('VALIDATION_ERROR', `${issue.path.join('.')}: ${issue.message}`);
    }

    const input: StockAdjustmentInput = validation.data;
    const actor = {
      id: user?.id || 'usr-pharmacist-001',
      name: user?.fullName || 'Authorized Staff Pharmacist',
    };

    const result = inventoryStore.recordStockAdjustment(input, actor);

    await auditLogger.log({
      eventType: 'inventory:stock_adjusted',
      entityType: 'medicine_batches',
      entityId: result.batch.id,
      action: 'adjust',
      userId: actor.id,
      newValues: {
        operation: 'stock_adjustment',
        type: input.adjustment_type,
        quantity: input.quantity,
        reason: input.reason,
        idempotency_key: input.idempotency_key,
        new_balance: result.batch.quantity_on_hand,
      },
    });

    return successResult(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stock adjustment failed';
    return errorResult('INTERNAL_ERROR', message);
  }
}

/**
 * Server Action: Quarantine a batch due to suspected contamination or recall.
 */
export async function quarantineBatchAction(
  batchId: string,
  reasonText: string,
): Promise<ActionResult<MedicineBatch>> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'inventory:adjust');
    if (!authCheck.success) {
      return authCheck;
    }

    if (!reasonText || reasonText.trim().length < 5) {
      return errorResult(
        'VALIDATION_ERROR',
        'A quarantine reason of at least 5 characters is required.',
      );
    }

    const actor = {
      id: user?.id || 'usr-pharmacist-001',
      name: user?.fullName || 'Authorized Staff Pharmacist',
    };

    const updatedBatch = inventoryStore.quarantineBatch(batchId, reasonText.trim(), actor);

    await auditLogger.log({
      eventType: 'inventory:batch_quarantined',
      entityType: 'medicine_batches',
      entityId: batchId,
      action: 'update',
      userId: actor.id,
      newValues: {
        operation: 'quarantine',
        reason: reasonText.trim(),
        status: 'quarantined',
      },
    });

    return successResult(updatedBatch);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to quarantine batch';
    return errorResult('INTERNAL_ERROR', message);
  }
}
