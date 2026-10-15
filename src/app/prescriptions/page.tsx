import type { Metadata } from 'next';
import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PrescriptionTable } from '@/components/prescriptions/prescription-table';
import { getPrescriptions } from '@/modules/prescriptions/server-queries';
import { PrescriptionStatus } from '@/modules/prescriptions/types';

export const metadata: Metadata = {
  title: 'Prescriptions & Clinical Orders',
  description:
    'Doctor clinical prescriptions, electronic orders, and ward medicine verifications at DHQ Hospital Kohat.',
};

interface PrescriptionsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export const instant = false;

export default async function PrescriptionsPage({ searchParams }: PrescriptionsPageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const search = resolvedParams.search || '';
  const status = (resolvedParams.status as PrescriptionStatus) || undefined;

  const data = await getPrescriptions({
    page,
    search,
    status,
    pageSize: 10,
  });

  return (
    <AppShell title="Prescription Queue" subtitle="DHQ Hospital Kohat — Clinical Intake Orders">
      <div className="space-y-3">
        <Breadcrumbs items={[{ label: 'Prescriptions', current: true }]} />

        <PrescriptionTable
          initialPrescriptions={data.prescriptions}
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          isLiveDatabase={data.isLiveDatabase}
          currentSearch={search}
          currentStatus={status || 'all'}
        />
      </div>
    </AppShell>
  );
}
