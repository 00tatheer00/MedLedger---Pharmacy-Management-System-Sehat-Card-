import { AppShell } from '@/components/layout/app-shell';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function PrescriptionsLoading() {
  return (
    <AppShell title="Prescription Queue" subtitle="DHQ Hospital Kohat — Clinical Intake Orders">
      <TableSkeleton
        title="Prescription Intake Queue"
        subtitle="Handwritten paper prescriptions transcribed into clinical orders awaiting dispensing verification."
        actionText="+ Transcribe Paper Prescription"
      />
    </AppShell>
  );
}
