import { AppShell } from '@/components/layout/app-shell';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function PatientsLoading() {
  return (
    <AppShell title="Patient Master Directory" subtitle="DHQ Hospital Kohat — Clinical Registry">
      <TableSkeleton
        title="Patient Master Directory"
        subtitle="Master patient index with Sehat Card entitlement status and hospital visit history."
        actionText="+ Register Patient"
      />
    </AppShell>
  );
}
