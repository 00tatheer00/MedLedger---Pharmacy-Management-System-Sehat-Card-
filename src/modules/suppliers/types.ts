/**
 * MedLedger — Suppliers Domain Types
 *
 * Defines pharmaceutical suppliers, contact records, and purchasing history summaries.
 */

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  ntn_number?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface SupplierWithStats extends Supplier {
  total_orders_count: number;
  total_invoiced_pkr: number;
  total_paid_pkr: number;
  outstanding_balance_pkr: number;
}

export interface SupplierFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

export interface PaginatedSuppliersResponse {
  suppliers: SupplierWithStats[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLiveDatabase: boolean;
}

export interface CreateSupplierInput {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  ntn_number?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  is_active?: boolean;
}
