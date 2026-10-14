import { AppShell } from '@/components/layout/app-shell';
import { DetailSkeleton } from '@/components/ui/detail-skeleton';

export default function PrescriptionDetailLoading() {
  return (
    <AppShell title="Prescription Order" subtitle="DHQ Hospital Kohat — Clinical Order Detail">
      <DetailSkeleton title="Prescription Order" />
    </AppShell>
  );
}
