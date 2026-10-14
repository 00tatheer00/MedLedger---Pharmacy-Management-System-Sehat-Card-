import { AppShell } from '@/components/layout/app-shell';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function DispensingLoading() {
  return (
    <AppShell
      title="Medicine Dispensing Counter"
      subtitle="DHQ Hospital Kohat — Central Dispensary & Stock Deductions"
    >
      <TableSkeleton
        title="Dispensing Counter"
        subtitle="Active prescription queue, batch FEFO selection, and dispensing records."
        actionText="+ New Dispense"
      />
    </AppShell>
  );
}
