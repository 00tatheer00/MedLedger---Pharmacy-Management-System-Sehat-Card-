'use server';

/**
 * MedLedger — Purchasing, Receiving & Payables Server Actions
 *
 * Implements server-side actions for Purchase Orders, Goods Receipt Notes (GRN),
 * and Multi-Invoice Supplier Payments with RBAC and audit logging.
 */

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/core/auth';
import { requirePermission } from '@/core/authorization';
import { auditLogger } from '@/core/audit';
import {
  createPurchaseOrderSchema,
  receiveGoodsSchema,
  recordSupplierPaymentSchema,
  purchaseOrderFilterSchema,
  goodsReceiptFilterSchema,
  supplierInvoiceFilterSchema,
  CreatePurchaseOrderSchemaType,
  ReceiveGoodsSchemaType,
  RecordSupplierPaymentSchemaType,
} from './validation';
import { purchasingStore } from './prototype-store';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  getGoodsReceipts,
  getSupplierInvoices,
  getSupplierInvoiceById,
} from './server-queries';
import {
  PurchaseOrder,
  PaginatedPurchaseOrdersResponse,
  GoodsReceipt,
  PaginatedGoodsReceiptsResponse,
  SupplierInvoice,
  PaginatedSupplierInvoicesResponse,
  SupplierPayment,
} from './types';

// ==========================================
// 1. Purchase Orders Actions
// ==========================================

export async function getPurchaseOrdersAction(
  rawFilters: unknown = {},
): Promise<{ success: boolean; data?: PaginatedPurchaseOrdersResponse; error?: string }> {
  try {
    const parsed = purchaseOrderFilterSchema.safeParse(rawFilters);
    const filters = parsed.success ? parsed.data : {};
    const res = await getPurchaseOrders(filters);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve purchase orders.',
    };
  }
}

export async function getPurchaseOrderByIdAction(
  id: string,
): Promise<{ success: boolean; data?: PurchaseOrder; error?: string }> {
  try {
    const po = await getPurchaseOrderById(id);
    if (!po) {
      return { success: false, error: 'Purchase order not found.' };
    }
    return { success: true, data: po };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve purchase order.',
    };
  }
}

export async function createPurchaseOrderAction(rawData: CreatePurchaseOrderSchemaType): Promise<{
  success: boolean;
  data?: PurchaseOrder;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'purchasing:manage');
    if (!authCheck.success) {
      return {
        success: false,
        error: 'Unauthorized: insufficient permissions to create purchase orders.',
      };
    }

    const validation = createPurchaseOrderSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed. Please verify form inputs.',
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const actor = {
      id: user?.id || 'demo-purchasing-staff',
      name: user?.fullName || 'Purchasing Staff',
    };

    const newPO = purchasingStore.createPurchaseOrder(validation.data, actor);

    await auditLogger.log({
      eventType: 'record_created',
      entityType: 'purchase_order',
      entityId: newPO.id,
      action: 'create',
      userId: actor.id,
      newValues: { po_number: newPO.po_number, total_amount: newPO.total_amount },
    });

    revalidatePath('/purchases');
    revalidatePath(`/purchases/${newPO.id}`);

    return { success: true, data: newPO };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create purchase order.',
    };
  }
}

// ==========================================
// 2. Goods Receiving Actions
// ==========================================

export async function receiveGoodsAction(rawData: ReceiveGoodsSchemaType): Promise<{
  success: boolean;
  data?: { receipt: GoodsReceipt; updatedPO?: PurchaseOrder; invoice?: SupplierInvoice };
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    const user = await getCurrentUser();
    const authCheck = requirePermission(user, 'purchasing:manage');
    if (!authCheck.success) {
      return {
        success: false,
        error: 'Unauthorized: insufficient permissions to record goods receipts.',
      };
    }

    const validation = receiveGoodsSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed. Please verify receipt details.',
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const actor = {
      id: user?.id || 'demo-purchasing-staff',
      name: user?.fullName || 'Purchasing Staff',
    };

    const result = purchasingStore.receiveGoods(validation.data, actor);

    await auditLogger.log({
      eventType: 'record_created',
      entityType: 'goods_receipt',
      entityId: result.receipt.id,
      action: 'create',
      userId: actor.id,
      newValues: {
        grn_number: result.receipt.grn_number,
        items_count: result.receipt.items.length,
        po_number: result.receipt.purchase_order_number,
      },
    });

    revalidatePath('/purchases');
    if (result.receipt.purchase_order_id) {
      revalidatePath(`/purchases/${result.receipt.purchase_order_id}`);
    }
    revalidatePath('/inventory');
    revalidatePath('/medicines');

    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to record goods receipt.',
    };
  }
}

export async function getGoodsReceiptsAction(
  rawFilters: unknown = {},
): Promise<{ success: boolean; data?: PaginatedGoodsReceiptsResponse; error?: string }> {
  try {
    const parsed = goodsReceiptFilterSchema.safeParse(rawFilters);
    const filters = parsed.success ? parsed.data : {};
    const res = await getGoodsReceipts(filters);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve goods receipts.',
    };
  }
}

// ==========================================
// 3. Supplier Invoices & Payments Actions
// ==========================================

export async function getSupplierInvoicesAction(
  rawFilters: unknown = {},
): Promise<{ success: boolean; data?: PaginatedSupplierInvoicesResponse; error?: string }> {
  try {
    const parsed = supplierInvoiceFilterSchema.safeParse(rawFilters);
    const filters = parsed.success ? parsed.data : {};
    const res = await getSupplierInvoices(filters);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve supplier invoices.',
    };
  }
}

export async function getSupplierInvoiceByIdAction(
  id: string,
): Promise<{ success: boolean; data?: SupplierInvoice; error?: string }> {
  try {
    const inv = await getSupplierInvoiceById(id);
    if (!inv) {
      return { success: false, error: 'Invoice not found.' };
    }
    return { success: true, data: inv };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve invoice.',
    };
  }
}

export async function recordSupplierPaymentAction(
  rawData: RecordSupplierPaymentSchemaType,
): Promise<{
  success: boolean;
  data?: { payment: SupplierPayment; updatedInvoices: SupplierInvoice[] };
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    const user = await getCurrentUser();
    // Finance staff or Pharmacy Manager or System Admin
    const authCheck = requirePermission(user, 'claims:manage');
    if (!authCheck.success) {
      const altCheck = requirePermission(user, 'purchasing:manage');
      if (!altCheck.success) {
        return {
          success: false,
          error: 'Unauthorized: insufficient permissions to record supplier payments.',
        };
      }
    }

    const validation = recordSupplierPaymentSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed. Please verify payment amount and allocations.',
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const actor = {
      id: user?.id || 'demo-finance-officer',
      name: user?.fullName || 'Finance Officer',
    };

    const result = purchasingStore.recordSupplierPayment(validation.data, actor);

    await auditLogger.log({
      eventType: 'record_created',
      entityType: 'supplier_payment',
      entityId: result.payment.id,
      action: 'create',
      userId: actor.id,
      newValues: {
        voucher_number: result.payment.payment_voucher_number,
        amount: result.payment.amount,
        allocations_count: result.payment.allocations.length,
      },
    });

    revalidatePath('/purchases');
    revalidatePath(`/suppliers/${validation.data.supplier_id}`);

    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to record supplier payment.',
    };
  }
}
