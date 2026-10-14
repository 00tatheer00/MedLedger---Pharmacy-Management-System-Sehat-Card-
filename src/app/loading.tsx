import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <AppShell
      title="Pharmacy Operations Dashboard"
      subtitle="DHQ Hospital Kohat — Clinical Intake & Inventory"
    >
      <div
        className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-150"
        aria-busy="true"
        role="status"
      >
        <span className="sr-only">Loading dashboard metrics...</span>

        {/* Welcome Banner Skeleton */}
        <div className="h-16 w-full rounded-2xl border border-border bg-card-bg p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-9 w-36 hidden sm:block rounded-xl" />
        </div>

        {/* KPI Cards Skeleton (4 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card-bg p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <div className="flex items-baseline justify-between">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="rounded-2xl border border-border bg-card-bg p-4 space-y-3 shadow-xs">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Operational Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card-bg p-4 h-64 space-y-3 shadow-xs">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card-bg p-4 h-64 space-y-3 shadow-xs">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="rounded-2xl border border-border bg-card-bg p-4 space-y-3 shadow-xs">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
