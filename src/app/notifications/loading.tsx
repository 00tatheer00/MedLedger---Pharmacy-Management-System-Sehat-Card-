import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
  return (
    <AppShell
      title="System Notifications & Alerts"
      subtitle="DHQ Hospital Kohat — Clinical & Inventory Surveillance"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>

        {/* Notification Cards */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card-bg p-4 flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3.5 w-96" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
