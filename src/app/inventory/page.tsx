import Link from 'next/link';
import { connection } from 'next/server';
import { Layers, History, AlertTriangle, Pill, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { InventoryOverviewCards } from '@/components/inventory/inventory-overview-cards';
import { BatchesTable } from '@/components/inventory/batches-table';
import { MovementsTable } from '@/components/inventory/movements-table';
import { AlertsView } from '@/components/inventory/alerts-view';
import { buttonVariants } from '@/components/ui/button';
import {
  getInventoryOverviewAction,
  getBatchesAction,
  getStockMovementsAction,
  getInventoryAlertsAction,
} from '@/modules/inventory/actions';

interface InventoryPageProps {
  searchParams: Promise<{
    tab?: 'batches' | 'movements' | 'alerts';
    search?: string;
    status?: string;
    expiry_window?: string;
    movement_type?: string;
    page?: string;
  }>;
}

export const instant = false;

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || 'batches';
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const search = resolvedParams.search || '';
  const status = resolvedParams.status || 'all';
  const expiryWindow = resolvedParams.expiry_window || 'all';
  const movementType = resolvedParams.movement_type || 'all';

  // Fetch overview
  const overviewResult = await getInventoryOverviewAction();
  const summary = overviewResult.success
    ? overviewResult.data
    : {
        total_medicines: 0,
        total_batches: 0,
        total_units_on_hand: 0,
        available_units: 0,
        quarantined_units: 0,
        expired_units: 0,
        low_stock_medicines_count: 0,
        out_of_stock_medicines_count: 0,
        near_expiry_batches_count: 0,
        expired_batches_count: 0,
        estimated_stock_value_pkr: 0,
        isLiveDatabase: false,
      };

  // Fetch data for active tab
  const batchesResult = await getBatchesAction({
    search,
    status: status as 'all' | 'available' | 'quarantined' | 'expired' | 'recalled' | 'depleted',
    expiry_window: expiryWindow as 'all' | 'expired' | 'near_expiry' | 'valid',
    page,
    pageSize: 12,
  });

  const movementsResult = await getStockMovementsAction({
    search,
    movement_type: movementType as
      'all' | 'receipt' | 'dispensing' | 'adjustment' | 'return' | 'expired_write_off',
    page,
    pageSize: 15,
  });

  const alertsResult = await getInventoryAlertsAction();

  const batchesData = batchesResult.success
    ? batchesResult.data
    : {
        batches: [],
        totalRecords: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 12,
        isLiveDatabase: false,
      };

  const movementsData = movementsResult.success
    ? movementsResult.data
    : {
        movements: [],
        totalRecords: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 15,
        isLiveDatabase: false,
      };

  const alerts = alertsResult.success ? alertsResult.data : [];

  return (
    <AppShell
      title="Inventory & Stock Control"
      subtitle="DHQ Hospital Kohat Central Pharmacy • Batch Ledger & Surveillance"
    >
      <div className="space-y-6">
        {/* Top KPI Metric Cards */}
        <InventoryOverviewCards summary={summary} />

        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-1">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Link
              href="/inventory?tab=batches"
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
                activeTab === 'batches'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-muted/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Batches Registry ({summary.total_batches})
            </Link>

            <Link
              href="/inventory?tab=movements"
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
                activeTab === 'movements'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-muted/50'
              }`}
            >
              <History className="w-4 h-4" />
              Stock Movement Ledger
            </Link>

            <Link
              href="/inventory?tab=alerts"
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'border-rose-500 text-rose-700 bg-rose-50/50'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-muted/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Surveillance Alerts ({alerts.length})
            </Link>
          </div>

          <Link
            href="/medicines"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'h-8 px-3 text-xs gap-1.5 shrink-0',
            })}
          >
            <Pill className="w-3.5 h-3.5" />
            Master Catalogue
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'batches' && (
          <BatchesTable
            initialData={batchesData}
            currentSearch={search}
            currentStatus={status}
            currentExpiryWindow={expiryWindow}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsTable
            initialData={movementsData}
            currentSearch={search}
            currentType={movementType}
          />
        )}

        {activeTab === 'alerts' && <AlertsView alerts={alerts} />}
      </div>
    </AppShell>
  );
}
