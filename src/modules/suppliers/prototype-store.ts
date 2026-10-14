/**
 * MedLedger — Suppliers Prototype Store
 *
 * In-memory repository with duplicate name prevention, active status filtering,
 * and purchasing history statistics.
 */

import {
  Supplier,
  SupplierWithStats,
  SupplierFilters,
  PaginatedSuppliersResponse,
  CreateSupplierInput,
  UpdateSupplierInput,
} from './types';

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Kohat Pharma Distributors',
    contact_person: 'Mohammad Irfan',
    phone: '0922-512345',
    email: 'irfan@kohatpharma.com',
    address: 'Bannu Road, Kohat, KP',
    ntn_number: '2837491-4',
    is_active: true,
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'sup-002',
    name: 'Khyber Drug Agency',
    contact_person: 'Zubair Khattak',
    phone: '091-5841200',
    email: 'orders@khyberdrug.com',
    address: 'Industrial Estate, Hayatabad, Peshawar',
    ntn_number: '1928374-1',
    is_active: true,
    created_at: '2026-09-10T09:30:00.000Z',
    updated_at: '2026-09-10T09:30:00.000Z',
  },
  {
    id: 'sup-003',
    name: 'Frontier Medical Supplies',
    contact_person: 'Asim Khan Bangash',
    phone: '0922-861144',
    email: 'frontiermed@gmail.com',
    address: 'Main Bazaar, Kohat Cantt',
    ntn_number: null,
    is_active: true,
    created_at: '2026-09-15T11:00:00.000Z',
    updated_at: '2026-09-15T11:00:00.000Z',
  },
  {
    id: 'sup-004',
    name: 'Universal Healthcare Services',
    contact_person: 'Dr. Rashid Minhas',
    phone: '051-2244888',
    email: 'info@universalhealth.pk',
    address: 'Blue Area, Islamabad',
    ntn_number: '7462819-2',
    is_active: false,
    created_at: '2026-08-20T10:00:00.000Z',
    updated_at: '2026-10-01T12:00:00.000Z',
  },
];

class SupplierPrototypeStore {
  private suppliers: Supplier[] = [...initialSuppliers];

  public getSuppliers(filters: SupplierFilters = {}): PaginatedSuppliersResponse {
    const { search = '', status = 'all', page = 1, pageSize = 20 } = filters;

    let list = this.suppliers.filter((s) => !s.deleted_at);

    // Status filter
    if (status === 'active') {
      list = list.filter((s) => s.is_active);
    } else if (status === 'inactive') {
      list = list.filter((s) => !s.is_active);
    }

    // Search query
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
          (s.phone && s.phone.toLowerCase().includes(q)) ||
          (s.ntn_number && s.ntn_number.toLowerCase().includes(q)),
      );
    }

    // Sort active first, then alphabetical by name
    list.sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const totalRecords = list.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const pageSlice = list.slice(startIndex, startIndex + pageSize);

    // Attach stats (mocked values consistent with demo dataset)
    const suppliersWithStats: SupplierWithStats[] = pageSlice.map((s) => {
      let ordersCount = 0;
      let invoiced = 0;
      let paid = 0;
      if (s.id === 'sup-001') {
        ordersCount = 8;
        invoiced = 485000;
        paid = 365000;
      } else if (s.id === 'sup-002') {
        ordersCount = 5;
        invoiced = 320000;
        paid = 320000;
      } else if (s.id === 'sup-003') {
        ordersCount = 3;
        invoiced = 145000;
        paid = 95000;
      }
      return {
        ...s,
        total_orders_count: ordersCount,
        total_invoiced_pkr: invoiced,
        total_paid_pkr: paid,
        outstanding_balance_pkr: invoiced - paid,
      };
    });

    return {
      suppliers: suppliersWithStats,
      totalRecords,
      totalPages,
      currentPage: page,
      pageSize,
      isLiveDatabase: false,
    };
  }

  public getSupplierById(id: string): SupplierWithStats | null {
    const s = this.suppliers.find((sup) => sup.id === id && !sup.deleted_at);
    if (!s) return null;

    let ordersCount = 0;
    let invoiced = 0;
    let paid = 0;
    if (s.id === 'sup-001') {
      ordersCount = 8;
      invoiced = 485000;
      paid = 365000;
    } else if (s.id === 'sup-002') {
      ordersCount = 5;
      invoiced = 320000;
      paid = 320000;
    } else if (s.id === 'sup-003') {
      ordersCount = 3;
      invoiced = 145000;
      paid = 95000;
    }

    return {
      ...s,
      total_orders_count: ordersCount,
      total_invoiced_pkr: invoiced,
      total_paid_pkr: paid,
      outstanding_balance_pkr: invoiced - paid,
    };
  }

  public getAllActiveRawSuppliers(): Supplier[] {
    return this.suppliers.filter((s) => s.is_active && !s.deleted_at);
  }

  public createSupplier(
    input: CreateSupplierInput,
    actor?: { id: string; name: string },
  ): Supplier {
    void actor;
    const normalizedName = input.name.trim();

    // Check duplicate name
    const nameExists = this.suppliers.some(
      (s) => !s.deleted_at && s.name.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (nameExists) {
      throw new Error(`A supplier named "${normalizedName}" already exists.`);
    }

    // Check duplicate NTN if provided
    if (input.ntn_number && input.ntn_number.trim()) {
      const normalizedNtn = input.ntn_number.trim();
      const ntnExists = this.suppliers.some((s) => !s.deleted_at && s.ntn_number === normalizedNtn);
      if (ntnExists) {
        throw new Error(`A supplier with NTN "${normalizedNtn}" already exists.`);
      }
    }

    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      name: normalizedName,
      contact_person: input.contact_person?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      ntn_number: input.ntn_number?.trim() || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    this.suppliers.unshift(newSupplier);
    return newSupplier;
  }

  public updateSupplier(
    id: string,
    input: UpdateSupplierInput,
    actor?: { id: string; name: string },
  ): Supplier {
    void actor;
    const index = this.suppliers.findIndex((s) => s.id === id && !s.deleted_at);
    if (index === -1) {
      throw new Error(`Supplier not found with ID: ${id}`);
    }

    const current = this.suppliers[index];

    if (input.name) {
      const normalizedName = input.name.trim();
      const nameExists = this.suppliers.some(
        (s) =>
          s.id !== id && !s.deleted_at && s.name.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (nameExists) {
        throw new Error(`Another supplier named "${normalizedName}" already exists.`);
      }
    }

    if (input.ntn_number && input.ntn_number.trim()) {
      const normalizedNtn = input.ntn_number.trim();
      const ntnExists = this.suppliers.some(
        (s) => s.id !== id && !s.deleted_at && s.ntn_number === normalizedNtn,
      );
      if (ntnExists) {
        throw new Error(`Another supplier with NTN "${normalizedNtn}" already exists.`);
      }
    }

    const updated: Supplier = {
      ...current,
      name: input.name ? input.name.trim() : current.name,
      contact_person:
        input.contact_person !== undefined
          ? input.contact_person?.trim() || null
          : current.contact_person,
      phone: input.phone !== undefined ? input.phone?.trim() || null : current.phone,
      email: input.email !== undefined ? input.email?.trim() || null : current.email,
      address: input.address !== undefined ? input.address?.trim() || null : current.address,
      ntn_number:
        input.ntn_number !== undefined ? input.ntn_number?.trim() || null : current.ntn_number,
      is_active: input.is_active !== undefined ? input.is_active : current.is_active,
      updated_at: new Date().toISOString(),
    };

    this.suppliers[index] = updated;
    return updated;
  }

  public toggleStatus(id: string): Supplier {
    const index = this.suppliers.findIndex((s) => s.id === id && !s.deleted_at);
    if (index === -1) {
      throw new Error(`Supplier not found with ID: ${id}`);
    }
    const current = this.suppliers[index];
    const updated = {
      ...current,
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    };
    this.suppliers[index] = updated;
    return updated;
  }

  public deleteSupplier(id: string): Supplier {
    const index = this.suppliers.findIndex((s) => s.id === id && !s.deleted_at);
    if (index === -1) {
      throw new Error(`Supplier not found with ID: ${id}`);
    }
    const current = this.suppliers[index];
    const updated = {
      ...current,
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.suppliers[index] = updated;
    return updated;
  }

  public resetForTesting(): void {
    this.suppliers = [...initialSuppliers];
  }
}

export const supplierStore = new SupplierPrototypeStore();
