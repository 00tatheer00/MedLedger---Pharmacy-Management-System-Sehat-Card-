import { AppShell } from '@/components/layout/app-shell';
import { DetailSkeleton } from '@/components/ui/detail-skeleton';

export default function MedicineDetailLoading() {
  return (
    <AppShell
      title="Medicine Master Profile"
      subtitle="DHQ Hospital Kohat — Central Dispensary Formulary"
    >
      <DetailSkeleton title="Medicine Profile" />
    </AppShell>
  );
}
