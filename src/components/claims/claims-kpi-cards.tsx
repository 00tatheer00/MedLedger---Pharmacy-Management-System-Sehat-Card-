'use client';

/**
 * MedLedger — Hospital Claims KPI Cards
 *
 * Displays financial summary metrics for DHQ Hospital reimbursement claims:
 * submitted claims, approved reimbursement, under review, collected payments, and balance.
 */

import { FileText, CheckCircle2, Clock, Landmark, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatPKR } from '@/lib/decimal';
import { ClaimOverviewKPIs } from '@/modules/claims/types';

interface ClaimsKpiCardsProps {
  kpis: ClaimOverviewKPIs;
}

export function ClaimsKpiCards({ kpis }: ClaimsKpiCardsProps) {
  const pendingCount = kpis.submitted_claims_count + kpis.under_review_count;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Submitted */}
      <Card className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Claims
          </p>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold text-slate-900">{kpis.total_claims_count}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Submitted:{' '}
            <span className="font-semibold text-slate-700">
              {formatPKR(kpis.total_submitted_amount)}
            </span>
          </p>
        </div>
      </Card>

      {/* 2. Pending Review */}
      <Card className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pending Review
          </p>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold text-slate-900">{pendingCount}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {kpis.submitted_claims_count} new, {kpis.under_review_count} in review
          </p>
        </div>
      </Card>

      {/* 3. Approved Reimbursement */}
      <Card className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Approved Claims
          </p>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold text-slate-900">{kpis.approved_claims_count}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Approved:{' '}
            <span className="font-semibold text-emerald-600">
              {formatPKR(kpis.total_approved_amount)}
            </span>
          </p>
        </div>
      </Card>

      {/* 4. Reimbursement Collected */}
      <Card className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Paid by Treasury
          </p>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold text-slate-900">
            {formatPKR(kpis.total_reimbursement_collected)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Settled hospital disbursements</p>
        </div>
      </Card>

      {/* 5. Outstanding Balance */}
      <Card className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Outstanding Balance
          </p>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold text-slate-900">
            {formatPKR(kpis.total_outstanding_balance)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Pending hospital disbursement</p>
        </div>
      </Card>
    </div>
  );
}
