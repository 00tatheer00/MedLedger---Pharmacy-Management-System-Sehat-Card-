import { Skeleton } from '@/components/ui/skeleton';

interface DetailSkeletonProps {
  title?: string;
}

export function DetailSkeleton({ title = 'Record Detail' }: DetailSkeletonProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-150" aria-busy="true" role="status">
      <span className="sr-only">Loading {title}...</span>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-16" />
        <span className="text-text-muted text-xs">/</span>
        <Skeleton className="h-3.5 w-24" />
        <span className="text-text-muted text-xs">/</span>
        <Skeleton className="h-3.5 w-28" />
      </div>

      {/* Header bar with Back button and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Metadata & Patient Info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-card-bg p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
            <div className="divide-y divide-border/60 pt-2 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="pt-3 flex justify-between items-center">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Items / History */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-border bg-card-bg p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-border flex justify-between">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <div className="divide-y divide-border/60">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex justify-between items-center">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
