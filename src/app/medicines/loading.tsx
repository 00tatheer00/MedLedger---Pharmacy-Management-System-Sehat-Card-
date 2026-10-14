import { AppShell } from '@/components/layout/app-shell';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function MedicinesLoading() {
  return (
    <AppShell
      title="Medicines Master Catalogue"
      subtitle="Central Dispensary Formulary & Active Pharmaceutical Registrations"
    >
      <TableSkeleton
        title="Medicines Master Catalogue"
        subtitle="Clinical pharmacy formulary, active dosage forms, and stock status."
        actionText="+ Add Medicine"
      />
    </AppShell>
  );
}
