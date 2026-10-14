import { AppShell } from '@/components/layout/app-shell';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PatientRegistrationForm } from '@/components/patients/patient-form';

export default function NewPatientPage() {
  return (
    <AppShell title="Patient Registration" subtitle="DHQ Hospital Kohat — Clinical Intake">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: 'Patients', href: '/patients' },
            { label: 'Register Patient', current: true },
          ]}
        />

        <PatientRegistrationForm />
      </div>
    </AppShell>
  );
}
