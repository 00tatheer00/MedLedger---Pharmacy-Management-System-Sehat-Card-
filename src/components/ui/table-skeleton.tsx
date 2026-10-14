import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  title?: string;
  subtitle?: string;
  actionText?: string;
  rowCount?: number;
}

export function TableSkeleton({ title, subtitle, actionText, rowCount = 6 }: TableSkeletonProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-150" aria-busy="true" role="status">
      <span className="sr-only">Loading records...</span>

      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-16" />
        <span className="text-text-muted text-xs">/</span>
        <Skeleton className="h-3.5 w-28" />
      </div>

      {/* Header & Primary Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            {title ? (
              <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                {title}
              </h1>
            ) : (
              <Skeleton className="h-7 w-60" />
            )}
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          {subtitle ? (
            <p className="text-xs text-text-secondary">{subtitle}</p>
          ) : (
            <Skeleton className="h-3.5 w-80" />
          )}
        </div>

        {actionText ? (
          <Skeleton className="h-10 w-44 rounded-xl self-start sm:self-auto" />
        ) : (
          <Skeleton className="h-10 w-48 rounded-xl self-start sm:self-auto" />
        )}
      </div>

      {/* Filter & Search Bar Skeleton */}
      <div className="rounded-xl border border-border bg-card-bg p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Data Table Card Skeleton */}
      <div className="rounded-2xl border border-border bg-card-bg overflow-hidden shadow-xs">
        {/* Table Header Columns */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3.5 bg-slate-50 border-b border-border items-center">
          <div className="col-span-2">
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="col-span-2 text-right flex justify-end">
            <Skeleton className="h-3.5 w-16" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-border/60">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div
              key={i}
              className="px-5 py-4 flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center"
            >
              <div className="md:col-span-2">
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <div className="md:col-span-3 space-y-1.5 w-full">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="md:col-span-2">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="md:col-span-1">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="md:col-span-2 flex justify-end w-full md:w-auto">
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Table Footer / Pagination Skeleton */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-border flex items-center justify-between">
          <Skeleton className="h-3.5 w-44" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
