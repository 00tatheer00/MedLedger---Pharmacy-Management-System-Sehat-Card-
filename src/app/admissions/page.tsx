import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { AdmissionsTable } from '@/components/admissions/admissions-table';
import { getAdmissions } from '@/modules/admissions/server-queries';
import { AdmissionStatus } from '@/modules/admissions/types';

interface AdmissionsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export const instant = false;

export default async function AdmissionsPage({ searchParams }: AdmissionsPageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const search = resolvedParams.search || '';
  const status = (resolvedParams.status as AdmissionStatus) || undefined;

  const data = await getAdmissions({
    page,
    search,
    status,
    pageSize: 10,
  });

  return (
    <AppShell title="Inpatient Admissions" subtitle="DHQ Hospital Kohat — Ward Bed Tracking">
      <div className="space-y-3">
        <Breadcrumbs items={[{ label: 'Admissions', current: true }]} />

        <AdmissionsTable
          initialAdmissions={data.admissions}
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
