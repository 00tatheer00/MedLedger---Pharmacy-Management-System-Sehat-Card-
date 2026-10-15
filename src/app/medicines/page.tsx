import type { Metadata } from 'next';
import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { MedicineTable } from '@/components/medicines/medicine-table';
import { getMedicinesAction } from '@/modules/medicines/actions';

export const metadata: Metadata = {
  title: 'Medicine Formulary & Hospital Rates',
  description:
    'DHQ Kohat official hospital medicine formulary, generic names, item codes, and government rates.',
};

interface MedicinesPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    status?: 'all' | 'active' | 'inactive';
    stock_status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
    page?: string;
  }>;
}

export const instant = false;

export default async function MedicinesPage({ searchParams }: MedicinesPageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const search = resolvedParams.search || '';
  const category = resolvedParams.category || '';
  const status = resolvedParams.status || 'all';
  const stock_status = resolvedParams.stock_status || 'all';

  const result = await getMedicinesAction(
    { search, category, status, stock_status },
    { page, pageSize: 10 },
  );

  const fallbackData = {
    medicines: [],
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    isLiveDatabase: false,
  };

  const paginatedData = result.success ? result.data : fallbackData;

  return (
    <AppShell
      title="Medicines Master Catalogue"
      subtitle="Central Dispensary Formulary & Active Pharmaceutical Registrations"
    >
      <MedicineTable
        initialData={paginatedData}
        currentSearch={search}
        currentCategory={category}
        currentStockStatus={stock_status}
      />
    </AppShell>
  );
}
