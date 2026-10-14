import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <AppShell
      title="System & Facility Settings"
      subtitle="DHQ Hospital Kohat — Operational & Security Configuration"
    >
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card-bg p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-60" />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
