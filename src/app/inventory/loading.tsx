import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function InventoryLoading() {
  return (
    <AppShell
      title="Inventory & Stock Control"
      subtitle="DHQ Hospital Kohat Central Pharmacy • Batch Ledger & Surveillance"
    >
      <div className="space-y-6">
        {/* Top KPI Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card-bg p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>

        {/* Batches Table Skeleton */}
        <TableSkeleton
          title="Active Stock Batches"
          subtitle="Real-time pharmaceutical batch ledger, FEFO tracking, and quarantine controls."
          actionText="+ Receive Stock"
        />
      </div>
    </AppShell>
  );
}
