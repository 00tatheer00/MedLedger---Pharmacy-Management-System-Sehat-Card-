import { AppShell } from '@/components/layout/app-shell';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { PriorityAlerts } from '@/components/dashboard/priority-alerts';
import { InventoryOverview } from '@/components/dashboard/inventory-overview';
import { RecentActivityTable } from '@/components/dashboard/recent-activity-table';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { PrototypeBanner } from '@/components/dashboard/prototype-banner';
import { getDashboardSummary } from '@/modules/dashboard/server-queries';

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <AppShell
      title="Pharmacy Operations Dashboard"
      subtitle="DHQ Hospital Kohat — Central Dispensary"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Welcome Section with live date and data connection indicator */}
        <WelcomeBanner isLiveDatabase={summary.isLiveDatabase} />

        {/* High-density Core KPI Metrics fed from data access boundary */}
        <KpiCards data={summary.kpis} />

        {/* Prioritized Quick Action Strip with distinct operational hierarchy */}
        <QuickActions />

        {/* Operational grid: Priority Alerts + Inventory Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          <div className="lg:col-span-7">
            <PriorityAlerts />
          </div>
          <div className="lg:col-span-5">
            <InventoryOverview />
          </div>
        </div>

        {/* Detailed Recent Journal Transactions Table */}
        <RecentActivityTable />

        {/* Compliance & Data Source Disclosure Footer */}
        <PrototypeBanner
          isLiveDatabase={summary.isLiveDatabase}
          sourceNotice={summary.sourceNotice}
        />
      </div>
    </AppShell>
  );
}
