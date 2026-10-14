import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import {
  MedicineWithStockSummary,
  MedicineFilters,
  MedicinePaginationParams,
  PaginatedMedicinesResult,
  StockHealthStatus,
} from './types';
import { medicineStore } from './prototype-store';

interface SupabaseBatchRow {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity_on_hand: number;
  status: 'available' | 'quarantined' | 'expired' | 'recalled' | 'depleted';
  unit_cost: number;
}

interface SupabaseMedicineRow {
  id: string;
  item_code: string | null;
  name: string;
  generic_name: string;
  dosage_form: string;
  strength: string;
  unit_of_measure: string;
  category: string;
  min_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  medicine_batches?: SupabaseBatchRow[];
}

/**
 * Server query for paginated medicine catalogue.
 */
export async function getMedicines(
  filters: MedicineFilters = {},
  pagination: MedicinePaginationParams = {},
): Promise<PaginatedMedicinesResult> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const page = Math.max(1, pagination.page || 1);
      const pageSize = Math.min(100, Math.max(1, pagination.pageSize || 10));

      let query = supabase
        .from('medicines')
        .select('*, medicine_batches(*)', { count: 'exact' })
        .is('deleted_at', null);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      if (filters.category) {
        query = query.ilike('category', `%${filters.category}%`);
      }

      if (filters.dosage_form) {
        query = query.ilike('dosage_form', `%${filters.dosage_form}%`);
      }

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,generic_name.ilike.%${filters.search}%,item_code.ilike.%${filters.search}%`,
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.order('name', { ascending: true }).range(from, to);

      if (error) {
        throw new Error(`Database error fetching medicines: ${error.message}`);
      }

      if (data) {
        const rows = data as unknown as SupabaseMedicineRow[];
        const formatted: MedicineWithStockSummary[] = rows.map((row) => {
          const batches = row.medicine_batches || [];
          const total_stock = batches.reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0);
          const available_stock = batches
            .filter((b) => b.status === 'available')
            .reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0);
          const quarantined_stock = batches
            .filter((b) => b.status === 'quarantined')
            .reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0);
          const expired_stock = batches
            .filter((b) => b.status === 'expired')
            .reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0);

          const sortedBatches = batches
            .filter((b) => b.status === 'available' && b.quantity_on_hand > 0)
            .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

          const earliest_expiry = sortedBatches[0]?.expiry_date || null;

          let stock_status: StockHealthStatus = 'in_stock';
          if (available_stock === 0 && total_stock === 0) {
            stock_status = 'out_of_stock';
          } else if (available_stock === 0 && expired_stock > 0) {
            stock_status = 'expired';
          } else if (available_stock <= row.min_threshold) {
            stock_status = 'low_stock';
          }

          return {
            id: row.id,
            item_code: row.item_code,
            name: row.name,
            generic_name: row.generic_name,
            dosage_form: row.dosage_form,
            strength: row.strength,
            unit_of_measure: row.unit_of_measure,
            category: row.category,
            min_threshold: row.min_threshold,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            deleted_at: row.deleted_at,
            total_stock,
            available_stock,
            quarantined_stock,
            expired_stock,
            batch_count: batches.length,
            earliest_expiry,
            stock_status,
          };
        });

        return {
          medicines: formatted,
          totalRecords: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize) || 1,
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

  return medicineStore.getMedicines(filters, pagination);
}

/**
 * Server query for single medicine details.
 */
export async function getMedicineById(id: string): Promise<MedicineWithStockSummary | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('medicines')
        .select('*, medicine_batches(*)')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error fetching medicine ${id}: ${error.message}`);
      }

      if (data) {
        const row = data as unknown as SupabaseMedicineRow;
        const batches = row.medicine_batches || [];
        const total_stock = batches.reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0);
        const available_stock = batches
          .filter((b) => b.status === 'available')
          .reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0);
        const quarantined_stock = batches
          .filter((b) => b.status === 'quarantined')
          .reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0);
        const expired_stock = batches
          .filter((b) => b.status === 'expired')
          .reduce((sum, b) => sum + (b.quantity_on_hand || 0), 0);

        const sortedBatches = batches
          .filter((b) => b.status === 'available' && b.quantity_on_hand > 0)
          .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

        const earliest_expiry = sortedBatches[0]?.expiry_date || null;

        let stock_status: StockHealthStatus = 'in_stock';
        if (available_stock === 0 && total_stock === 0) {
          stock_status = 'out_of_stock';
        } else if (available_stock === 0 && expired_stock > 0) {
          stock_status = 'expired';
        } else if (available_stock <= row.min_threshold) {
          stock_status = 'low_stock';
        }

        return {
          id: row.id,
          item_code: row.item_code,
          name: row.name,
          generic_name: row.generic_name,
          dosage_form: row.dosage_form,
          strength: row.strength,
          unit_of_measure: row.unit_of_measure,
          category: row.category,
          min_threshold: row.min_threshold,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
          total_stock,
          available_stock,
          quarantined_stock,
          expired_stock,
          batch_count: batches.length,
          earliest_expiry,
          stock_status,
        };
      }
      return null;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return medicineStore.getMedicineById(id);
}
