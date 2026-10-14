import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PrescriptionTranscriptionForm } from '@/components/prescriptions/prescription-form';
import { getPatients } from '@/modules/patients/server-queries';
import { getPrescriptionMedicinesList } from '@/modules/prescriptions/server-queries';

interface NewPrescriptionPageProps {
  searchParams: Promise<{
    patientId?: string;
  }>;
}

export const instant = false;

export default async function NewPrescriptionPage({ searchParams }: NewPrescriptionPageProps) {
  const resolvedParams = await searchParams;
  const [patientsData, medicines] = await Promise.all([
    getPatients({ pageSize: 50 }),
    getPrescriptionMedicinesList(),
  ]);

  return (
    <AppShell title="Transcribe Paper Prescription" subtitle="DHQ Hospital Kohat — Clinical Intake">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: 'Prescriptions', href: '/prescriptions' },
            { label: 'Transcribe Prescription', current: true },
          ]}
        />

        <PrescriptionTranscriptionForm
          patients={patientsData.patients}
          medicines={medicines}
          preselectedPatientId={resolvedParams.patientId}
        />
      </div>
    </AppShell>
  );
}
