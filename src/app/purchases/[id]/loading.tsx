import { AppShell } from '@/components/layout/app-shell';
import { DetailSkeleton } from '@/components/ui/detail-skeleton';

export default function PurchaseDetailLoading() {
  return (
    <AppShell
      title="Purchase Order Detail"
      subtitle="DHQ Hospital Kohat — Procurement & Goods Receiving"
    >
      <DetailSkeleton title="Purchase Order" />
    </AppShell>
  );
}
