import type { Metadata } from 'next';
import { connection } from 'next/server';
import { AppShell } from '@/components/layout/app-shell';
import { ReportsDashboardClient } from '@/components/reports';
import {
  fetchFinancialKPIs,
  fetchReconciliationAudit,
  fetchFinancialTransactions,
} from '@/modules/finance/server-queries';
import { ReportGenerator } from '@/modules/reports/generators';
import { BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pharmacy Analytics & Financial Reports',
  description:
    'DHQ Kohat financial reconciliations, stock utilization analytics, and Sehat Sahulat Program audit reports.',
};

export const instant = false;

export default async function ReportsPage() {
  await connection();
  const [kpis, initialAudit, transactions] = await Promise.all([
    fetchFinancialKPIs(),
    fetchReconciliationAudit(),
    fetchFinancialTransactions({ pageSize: 50 }),
  ]);

  const initialReport = ReportGenerator.generate(
    'stock_overview',
    {},
    'DHQ Pharmacy Administrator',
  );

  return (
    <AppShell
      title="Analytics & Statutory Reports"
      subtitle="DHQ Hospital Kohat — Financial & Operational Intelligence"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Statutory Reporting & Financial Ledger Audit
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-dimensional reporting across 14 statutory statements, RFC 4180 CSV exports, and
              live payment allocation reconciliation for DHQ Hospital Kohat.
            </p>
          </div>
        </div>

        <ReportsDashboardClient
          kpis={kpis}
          initialReport={initialReport}
          initialAudit={initialAudit}
          transactions={transactions}
        />
      </div>
    </AppShell>
  );
}
