import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FinancialPositionKPIs } from '@/modules/finance/types';
import { DollarSign, TrendingUp, Receipt, Scale, ShieldCheck, AlertTriangle } from 'lucide-react';

interface FinancialKpiCardsProps {
  kpis: FinancialPositionKPIs;
}

export function FinancialKpiCards({ kpis }: FinancialKpiCardsProps) {
  const isHealthy = kpis.net_financial_position >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Supplier Payables */}
      <Card className="border border-border/70 shadow-xs hover:border-border transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Supplier Payables
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">
              Rs. {kpis.total_payables.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
            <span>Outstanding Invoices:</span>
            <Badge variant="warning" size="sm">
              {kpis.pending_invoices_count} pending
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2. Hospital Claim Receivables */}
      <Card className="border border-border/70 shadow-xs hover:border-border transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Treasury Receivables
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">
              Rs. {kpis.total_receivables.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
            <span>Approved / Unpaid Claims:</span>
            <Badge variant="info" size="sm">
              {kpis.pending_claims_count} claims
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 3. Disbursed vs Reimbursements Collected */}
      <Card className="border border-border/70 shadow-xs hover:border-border transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Collected vs Disbursed
            </span>
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">
              Rs.{' '}
              {kpis.total_reimbursements_collected.toLocaleString('en-PK', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
            <span>Disbursed to Suppliers:</span>
            <span className="font-mono font-medium text-text-primary">
              Rs. {kpis.total_disbursed.toLocaleString('en-PK')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Net Financial Position */}
      <Card className="border border-border/70 shadow-xs hover:border-border transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Net Financial Balance
            </span>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tracking-tight ${
                isHealthy ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              Rs.{' '}
              {kpis.net_financial_position.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-text-secondary">Audit Status:</span>
            {isHealthy ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Balanced Position
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Payables Exceed Inflows
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
