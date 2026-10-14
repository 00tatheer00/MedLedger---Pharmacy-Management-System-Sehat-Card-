import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function ClaimsLoading() {
  return (
    <AppShell title="Hospital Claims & Billing" subtitle="DHQ Hospital Kohat">
      <div className="space-y-6">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card-bg p-4 space-y-3 shadow-xs"
            >
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>

        <TableSkeleton
          title="Reimbursement Claims Management"
          subtitle="Prepare, submit, track, and reconcile hospital reimbursement claims."
          actionText="Prepare New Claim"
        />
      </div>
    </AppShell>
  );
}
