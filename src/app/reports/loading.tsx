import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <AppShell
      title="Analytics & Statutory Reports"
      subtitle="DHQ Hospital Kohat — Financial & Operational Intelligence"
    >
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Financial KPI Cards */}
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

        {/* Report Content Skeleton */}
        <div className="rounded-2xl border border-border bg-card-bg p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
