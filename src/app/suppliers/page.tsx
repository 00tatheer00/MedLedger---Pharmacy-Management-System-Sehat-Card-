import type { Metadata } from 'next';
import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { SuppliersTable } from '@/components/suppliers/suppliers-table';
import { getSuppliersAction } from '@/modules/suppliers/actions';

export const metadata: Metadata = {
  title: 'Registered Medicine Suppliers & Vendors',
  description:
    'Pharmaceutical vendors, distributor contacts, and drug license records for DHQ Hospital Kohat.',
};

interface SuppliersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: 'all' | 'active' | 'inactive';
    page?: string;
  }>;
}

export const instant = false;

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const search = resolvedParams.search || '';
  const status = resolvedParams.status || 'all';

  const result = await getSuppliersAction({
    search,
    status,
    page,
    pageSize: 10,
  });

  const fallbackData = {
    suppliers: [],
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    isLiveDatabase: false,
  };

  const paginatedData = result.success && result.data ? result.data : fallbackData;

  return (
    <AppShell
      title="Supplier & Vendor Directory"
      subtitle="Authorized Pharmaceutical Distributors & Drug License Registrations"
    >
      <SuppliersTable initialData={paginatedData} currentSearch={search} currentStatus={status} />
    </AppShell>
  );
}
