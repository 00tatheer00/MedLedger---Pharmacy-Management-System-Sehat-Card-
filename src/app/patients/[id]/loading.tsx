import { AppShell } from '@/components/layout/app-shell';
import { DetailSkeleton } from '@/components/ui/detail-skeleton';

export default function PatientDetailLoading() {
  return (
    <AppShell title="Patient Record" subtitle="DHQ Hospital Kohat — Clinical Registry">
      <DetailSkeleton title="Patient Record" />
    </AppShell>
  );
}
