/**
 * MedLedger — Server-side Purchasing Queries
 *
 * Provides typed queries for Supabase PostgreSQL with prototype store fallback in development.
 * In staging and production tiers, unconfigured database or query errors fail-closed.
 */

import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { purchasingStore } from './prototype-store';
import {
  PurchaseOrder,
  PurchaseOrderFilters,
  PaginatedPurchaseOrdersResponse,
  GoodsReceipt,
  GoodsReceiptFilters,
  PaginatedGoodsReceiptsResponse,
  SupplierInvoice,
  SupplierInvoiceFilters,
  PaginatedSupplierInvoicesResponse,
  SupplierPayment,
} from './types';

export async function getPurchaseOrders(
  filters: PurchaseOrderFilters = {},
): Promise<PaginatedPurchaseOrdersResponse> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { search = '', supplier_id, status = 'all', page = 1, pageSize = 20 } = filters;

      let query = supabase
        .from('purchase_orders')
        .select('*, supplier:suppliers(*), items:purchase_order_items(*)', { count: 'exact' });

      if (supplier_id) {
        query = query.eq('supplier_id', supplier_id);
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (search.trim()) {
        query = query.ilike('po_number', `%${search.trim()}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.order('order_date', { ascending: false }).range(from, to);

      const { data, count, error } = await query;
      if (error) {
        throw new Error(`Database error fetching purchase orders: ${error.message}`);
      }

      if (data) {
        const totalRecords = count || data.length;
        const totalPages = Math.ceil(totalRecords / pageSize) || 1;

        return {
          orders: data as PurchaseOrder[],
          totalRecords,
          totalPages,
          currentPage: page,
          pageSize,
          isLiveDatabase: true,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return purchasingStore.getPurchaseOrders(filters);
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, supplier:suppliers(*), items:purchase_order_items(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error fetching purchase order ${id}: ${error.message}`);
      }

      return data as PurchaseOrder | null;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return purchasingStore.getPurchaseOrderById(id);
}

export async function getGoodsReceipts(
  filters: GoodsReceiptFilters = {},
): Promise<PaginatedGoodsReceiptsResponse> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { search = '', supplier_id, purchase_order_id, page = 1, pageSize = 20 } = filters;

      let query = supabase
        .from('goods_receipts')
        .select('*, items:goods_receipt_items(*)', { count: 'exact' });

      if (supplier_id) {
        query = query.eq('supplier_id', supplier_id);
      }
      if (purchase_order_id) {
        query = query.eq('purchase_order_id', purchase_order_id);
      }
      if (search.trim()) {
        query = query.ilike('grn_number', `%${search.trim()}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.order('received_date', { ascending: false }).range(from, to);

      const { data, count, error } = await query;
      if (error) {
        throw new Error(`Database error fetching goods receipts: ${error.message}`);
      }

      if (data) {
        const totalRecords = count || data.length;
        const totalPages = Math.ceil(totalRecords / pageSize) || 1;

        return {
          receipts: data as GoodsReceipt[],
          totalRecords,
          totalPages,
          currentPage: page,
          pageSize,
          isLiveDatabase: true,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return purchasingStore.getGoodsReceipts(filters);
}

export async function getSupplierInvoices(
  filters: SupplierInvoiceFilters = {},
): Promise<PaginatedSupplierInvoicesResponse> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { search = '', supplier_id, status = 'all', page = 1, pageSize = 20 } = filters;

      let query = supabase.from('supplier_invoices').select('*', { count: 'exact' });

      if (supplier_id) {
        query = query.eq('supplier_id', supplier_id);
      }
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (search.trim()) {
        query = query.ilike('invoice_number', `%${search.trim()}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.order('invoice_date', { ascending: false }).range(from, to);

      const { data, count, error } = await query;
      if (error) {
        throw new Error(`Database error fetching supplier invoices: ${error.message}`);
      }

      if (data) {
        const totalRecords = count || data.length;
        const totalPages = Math.ceil(totalRecords / pageSize) || 1;

        return {
          invoices: data as SupplierInvoice[],
          totalRecords,
          totalPages,
          currentPage: page,
          pageSize,
          isLiveDatabase: true,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return purchasingStore.getSupplierInvoices(filters);
}

export async function getSupplierInvoiceById(id: string): Promise<SupplierInvoice | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error fetching supplier invoice ${id}: ${error.message}`);
      }

      return data as SupplierInvoice | null;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return purchasingStore.getSupplierInvoiceById(id);
}

export async function getSupplierPayments(supplier_id?: string): Promise<SupplierPayment[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      let query = supabase.from('supplier_payments').select('*');
      if (supplier_id) {
        query = query.eq('supplier_id', supplier_id);
      }
      query = query.order('payment_date', { ascending: false });

      const { data, error } = await query;
      if (error) {
        throw new Error(`Database error fetching supplier payments: ${error.message}`);
      }

      return (data || []) as SupplierPayment[];
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return purchasingStore.getSupplierPayments(supplier_id);
}
