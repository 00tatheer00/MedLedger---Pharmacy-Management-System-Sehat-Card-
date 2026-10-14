import { AppShell } from '@/components/layout/app-shell';
import { MedicineRegistrationForm } from '@/components/medicines/medicine-form';

export default function NewMedicinePage() {
  return (
    <AppShell
      title="Register Catalogue Item"
      subtitle="Add New Pharmaceutical Product to Central Formulary"
    >
      <MedicineRegistrationForm />
    </AppShell>
  );
}
