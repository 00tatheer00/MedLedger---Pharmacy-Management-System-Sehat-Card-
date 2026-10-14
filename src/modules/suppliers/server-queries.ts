/**
 * MedLedger — Server-side Supplier Queries
 *
 * Provides typed queries for Supabase with automatic prototype store fallback in development.
 * In staging and production tiers, unconfigured database or query errors fail-closed.
 */

import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import { supplierStore } from './prototype-store';
import { Supplier, SupplierWithStats, SupplierFilters, PaginatedSuppliersResponse } from './types';

export async function getSuppliers(
  filters: SupplierFilters = {},
): Promise<PaginatedSuppliersResponse> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { search = '', status = 'all', page = 1, pageSize = 20 } = filters;

      let query = supabase.from('suppliers').select('*', { count: 'exact' });

      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (search.trim()) {
        query = query.or(
          `name.ilike.%${search.trim()}%,contact_person.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`,
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.order('name', { ascending: true }).range(from, to);

      const { data, count, error } = await query;
      if (error) {
        throw new Error(`Database error fetching suppliers: ${error.message}`);
      }

      if (data) {
        const totalRecords = count || data.length;
        const totalPages = Math.ceil(totalRecords / pageSize) || 1;

        const suppliersWithStats: SupplierWithStats[] = data.map((s: Supplier) => ({
          ...s,
          total_orders_count: 0,
          total_invoiced_pkr: 0,
          total_paid_pkr: 0,
          outstanding_balance_pkr: 0,
        }));

        return {
          suppliers: suppliersWithStats,
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

  return supplierStore.getSuppliers(filters);
}

export async function getSupplierById(id: string): Promise<SupplierWithStats | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error fetching supplier ${id}: ${error.message}`);
      }

      if (!data) return null;

      return {
        ...data,
        total_orders_count: 0,
        total_invoiced_pkr: 0,
        total_paid_pkr: 0,
        outstanding_balance_pkr: 0,
      };
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return supplierStore.getSupplierById(id);
}
