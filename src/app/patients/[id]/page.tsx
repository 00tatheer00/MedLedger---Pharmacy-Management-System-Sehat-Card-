import Link from 'next/link';
import { connection } from 'next/server';
import { UserX } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PatientDetailCard } from '@/components/patients/patient-detail-card';
import { getPatientById } from '@/modules/patients/server-queries';

interface PatientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  await connection();
  const resolvedParams = await params;
  const patient = await getPatientById(resolvedParams.id);

  if (!patient) {
    return (
      <AppShell title="Patient Record" subtitle="DHQ Hospital Kohat">
        <div className="space-y-3">
          <Breadcrumbs
            items={[
              { label: 'Patients', href: '/patients' },
              { label: 'Record Not Found', current: true },
            ]}
          />

          <div className="py-16">
            <EmptyState
              icon={UserX}
              title="Patient Record Not Found"
              description="The requested medical record number or patient identifier does not exist or has been archived."
              action={
                <Link href="/patients">
                  <Button variant="primary" size="sm" className="mt-2">
                    Return to Patient Directory
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${patient.full_name} (${patient.mr_number})`}
      subtitle="DHQ Hospital Kohat — Patient Profile"
    >
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: 'Patients', href: '/patients' },
            { label: `${patient.full_name} (${patient.mr_number})`, current: true },
          ]}
        />

        <PatientDetailCard patient={patient} />
      </div>
    </AppShell>
  );
}
