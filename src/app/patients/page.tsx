import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PatientTable } from '@/components/patients/patient-table';
import { getPatients } from '@/modules/patients/server-queries';
import { Gender } from '@/modules/patients/types';

interface PatientsPageProps {
  searchParams: Promise<{
    search?: string;
    gender?: string;
    status?: string;
    page?: string;
  }>;
}

export const instant = false;

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const search = resolvedParams.search || '';
  const gender = (resolvedParams.gender as Gender) || undefined;
  const admissionStatus = (resolvedParams.status as 'all' | 'admitted' | 'outpatient') || undefined;

  const data = await getPatients({
    page,
    search,
    gender,
    admissionStatus,
    pageSize: 10,
  });

  return (
    <AppShell title="Patient Master Directory" subtitle="DHQ Hospital Kohat — Clinical Registry">
      <div className="space-y-3">
        <Breadcrumbs items={[{ label: 'Patients', current: true }]} />

        <PatientTable
          initialPatients={data.patients}
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          isLiveDatabase={data.isLiveDatabase}
          currentSearch={search}
          currentGender={gender || 'all'}
          currentAdmissionStatus={admissionStatus || 'all'}
        />
      </div>
    </AppShell>
  );
}
