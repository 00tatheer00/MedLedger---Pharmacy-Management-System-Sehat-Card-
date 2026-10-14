import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div
      className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-150"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">Loading dashboard metrics...</span>

      {/* Welcome Banner Skeleton */}
      <div className="h-14 w-full rounded-xl border border-border bg-card-bg/60 p-4 flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-8 w-36 hidden sm:block" />
      </div>

      {/* KPI Cards Skeleton (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card-bg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7.5 w-7.5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="rounded-xl border border-border bg-card-bg p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Operational Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        <div className="lg:col-span-7 rounded-xl border border-border bg-card-bg p-4 h-64 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-5 rounded-xl border border-border bg-card-bg p-4 h-64 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-border bg-card-bg p-4 space-y-3">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
