import { isSupabaseConfigured, getEnvConfig } from '@/core/config/env';
import { createServerClient } from '@/core/database/client';
import {
  MedicineBatch,
  StockMovement,
  BatchFilters,
  MovementFilters,
  InventoryOverviewSummary,
  InventoryAlert,
  BatchStatus,
  MovementType,
  ReferenceType,
} from './types';
import { inventoryStore } from './prototype-store';

interface SupabaseBatchWithMedicineRow {
  id: string;
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity_on_hand: number;
  quantity_received: number;
  unit_cost: number;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  medicines?: {
    id: string;
    name: string;
    strength: string;
    dosage_form: string;
    min_threshold: number;
    is_active: boolean;
  };
}

/**
 * Server query for inventory warehouse summary metrics.
 */
export async function getInventoryOverview(): Promise<InventoryOverviewSummary> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      // Query counts and totals from Supabase
      const { data: batches, error } = await supabase
        .from('medicine_batches')
        .select('*, medicines(id, name, min_threshold, is_active)');

      if (error) {
        throw new Error(`Database error fetching inventory overview: ${error.message}`);
      }

      if (batches) {
        const rows = batches as unknown as SupabaseBatchWithMedicineRow[];
        const totalMedicines = new Set(rows.map((b) => b.medicine_id)).size;
        let totalUnits = 0;
        let availableUnits = 0;
        let quarantinedUnits = 0;
        let expiredUnits = 0;
        let estimatedValue = 0;
        let nearExpiryCount = 0;
        let expiredCount = 0;

        const todayStr = new Date().toISOString().slice(0, 10);
        const future60Days = new Date();
        future60Days.setDate(future60Days.getDate() + 60);
        const future60Str = future60Days.toISOString().slice(0, 10);

        rows.forEach((b) => {
          const qty = b.quantity_on_hand || 0;
          totalUnits += qty;
          estimatedValue += qty * (Number(b.unit_cost) || 0);

          if (b.status === 'available') availableUnits += qty;
          if (b.status === 'quarantined') quarantinedUnits += qty;
          if (b.status === 'expired') expiredUnits += qty;

          if (qty > 0) {
            if (b.expiry_date < todayStr || b.status === 'expired') {
              expiredCount++;
            } else if (b.expiry_date <= future60Str) {
              nearExpiryCount++;
            }
          }
        });

        return {
          total_medicines: totalMedicines,
          total_batches: rows.length,
          total_units_on_hand: totalUnits,
          available_units: availableUnits,
          quarantined_units: quarantinedUnits,
          expired_units: expiredUnits,
          low_stock_medicines_count: 0,
          out_of_stock_medicines_count: 0,
          near_expiry_batches_count: nearExpiryCount,
          expired_batches_count: expiredCount,
          estimated_stock_value_pkr: Math.round(estimatedValue),
          isLiveDatabase: true,
        };
      }
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return inventoryStore.getInventoryOverview();
}

/**
 * Server query for batches list.
 */
export async function getBatches(filters: BatchFilters = {}): Promise<{
  batches: (MedicineBatch & { medicine_name?: string; strength?: string; dosage_form?: string })[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLiveDatabase: boolean;
}> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const page = Math.max(1, filters.page || 1);
      const pageSize = Math.min(100, Math.max(1, filters.pageSize || 10));

      let query = supabase
        .from('medicine_batches')
        .select('*, medicines(id, name, strength, dosage_form)', { count: 'exact' });

      if (filters.medicine_id) {
        query = query.eq('medicine_id', filters.medicine_id);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('expiry_date', { ascending: true })
        .range(from, to);

      if (error) {
        throw new Error(`Database error fetching batches: ${error.message}`);
      }

      if (data) {
        const rows = data as unknown as SupabaseBatchWithMedicineRow[];
        const formatted = rows.map((b) => ({
          ...b,
          medicine: b.medicines as unknown as MedicineBatch['medicine'],
          medicine_name: b.medicines?.name,
          strength: b.medicines?.strength,
          dosage_form: b.medicines?.dosage_form,
        }));

        return {
          batches: formatted,
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

  const result = inventoryStore.getBatches(filters);
  return { ...result, isLiveDatabase: false };
}

/**
 * Server query for single batch details.
 */
export async function getBatchById(id: string): Promise<MedicineBatch | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('medicine_batches')
        .select('*, medicines(id, name, strength, dosage_form, min_threshold, is_active)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error fetching batch ${id}: ${error.message}`);
      }

      if (data) {
        const row = data as unknown as SupabaseBatchWithMedicineRow;
        return {
          ...row,
          medicine: row.medicines as unknown as MedicineBatch['medicine'],
        };
      }
      return null;
    }
  }

  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development') {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return inventoryStore.getBatchById(id);
}

/**
 * Server query for stock movements ledger.
 */
export async function getStockMovements(filters: MovementFilters = {}): Promise<{
  movements: StockMovement[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLiveDatabase: boolean;
}> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    if (supabase) {
      const page = Math.max(1, filters.page || 1);
      const pageSize = Math.min(100, Math.max(1, filters.pageSize || 10));

      let query = supabase.from('stock_movements').select(
        `
          *,
          batch:medicine_batches(id, batch_number, expiry_date, medicine:medicines(id, name, strength, dosage_form)),
          performer:profiles(id, full_name)
        `,
        { count: 'exact' },
      );

      if (filters.movement_type && filters.movement_type !== 'all') {
        query = query.eq('movement_type', filters.movement_type);
      }
      if (filters.medicine_id) {
        query = query.eq('medicine_id', filters.medicine_id);
      }
      if (filters.batch_id) {
        query = query.eq('batch_id', filters.batch_id);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Database error fetching stock movements: ${error.message}`);
      }

      if (data) {
        type SupabaseMovementRow = {
          id: string;
          medicine_id: string;
          batch_id: string;
          movement_type: StockMovement['movement_type'];
          quantity: number;
          reference_type: string;
          reference_id: string;
          notes: string | null;
          performed_by: string;
          created_at: string;
          batch?: {
            batch_number: string;
            expiry_date: string;
            medicine?: { name: string; strength: string; dosage_form: string } | null;
          } | null;
          performer?: { full_name: string } | null;
        };

        const rows = data as unknown as SupabaseMovementRow[];
        const movements: StockMovement[] = rows.map((r) => ({
          id: r.id,
          medicine_batch_id: r.batch_id,
          movement_type: r.movement_type as MovementType,
          quantity: r.quantity,
          reference_type: (r.reference_type as ReferenceType) || 'dispensing_item',
          reference_id: r.reference_id,
          reason: r.notes,
          performed_by: r.performed_by,
          performed_by_name: r.performer?.full_name || 'Staff User',
          performed_at: r.created_at,
          batch_number: r.batch?.batch_number || 'BATCH',
          medicine_id: r.medicine_id,
          medicine_name: r.batch?.medicine?.name || 'Medicine',
          strength: r.batch?.medicine?.strength || '',
          dosage_form: r.batch?.medicine?.dosage_form || '',
        }));

        return {
          movements,
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

  const result = inventoryStore.getStockMovements(filters);
  return { ...result, isLiveDatabase: false };
}

/**
 * Server query for surveillance alerts.
 */
export async function getInventoryAlerts(): Promise<InventoryAlert[]> {
  const env = getEnvConfig();
  if (env.NEXT_PUBLIC_APP_ENV !== 'development' && !isSupabaseConfigured()) {
    throw new Error('Supabase database configuration missing in staging/production tier.');
  }

  return inventoryStore.getAlerts();
}
