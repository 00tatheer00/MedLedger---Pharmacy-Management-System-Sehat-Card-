import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Plus, Receipt } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { fetchClaims, fetchClaimsKPIs } from '@/modules/claims/server-queries';
import { ClaimsKpiCards } from '@/components/claims/claims-kpi-cards';
import { ClaimsTable } from '@/components/claims/claims-table';

export const metadata: Metadata = {
  title: 'Sehat Card (SSP) Claims & Billing',
  description:
    'Sehat Sahulat Program reimbursement claims, government audit files, and reconciliation at DHQ Hospital Kohat.',
};

export const instant = false;

export default async function ClaimsPage() {
  await connection();
  const [claimsResult, kpis] = await Promise.all([
    fetchClaims({ pageSize: 50 }),
    fetchClaimsKPIs(),
  ]);

  return (
    <AppShell title="Hospital Claims & Billing" subtitle="DHQ Hospital Kohat">
      <div className="space-y-6">
        {/* Hub Header with Quick Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              Reimbursement Claims Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Prepare, submit, track, and reconcile private pharmacy reimbursement claims against
              DHQ Hospital.
            </p>
          </div>

          <Link href="/claims/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Prepare New Claim
            </Button>
          </Link>
        </div>

        {/* Financial KPI Cards */}
        <ClaimsKpiCards kpis={kpis} />

        {/* Claims Queue Table */}
        <ClaimsTable initialClaims={claimsResult.claims} />
      </div>
    </AppShell>
  );
}
