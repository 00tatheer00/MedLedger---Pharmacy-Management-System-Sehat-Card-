import { AppShell } from '@/components/layout/app-shell';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function AdmissionsLoading() {
  return (
    <AppShell title="Inpatient Admissions" subtitle="DHQ Hospital Kohat — Ward Bed Tracking">
      <TableSkeleton
        title="Inpatient Admissions"
        subtitle="Active hospital admissions, ward bed allocations, and clinical care settings."
        actionText="+ Record Admission"
      />
    </AppShell>
  );
}
