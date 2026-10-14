'use client';

import React, { useState } from 'react';
import { FinancialKpiCards } from './financial-kpi-cards';
import { ReportViewer } from './report-viewer';
import { ReconciliationView } from './reconciliation-view';
import {
  FinancialPositionKPIs,
  ReconciliationAuditReport,
  FinancialTransaction,
} from '@/modules/finance/types';
import { ReportExecutionResult } from '@/modules/reports/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  ShieldCheck,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsDashboardClientProps {
  kpis: FinancialPositionKPIs;
  initialReport: ReportExecutionResult;
  initialAudit: ReconciliationAuditReport;
  transactions?: FinancialTransaction[];
}

export function ReportsDashboardClient({
  kpis,
  initialReport,
  initialAudit,
  transactions = [],
}: ReportsDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'reconciliation' | 'cashflow'>('reports');

  return (
    <div className="space-y-6">
      {/* 1. Executive Summary & KPIs */}
      <FinancialKpiCards kpis={kpis} />

      {/* 2. Navigation Tab Bar */}
      <div className="flex border-b border-border space-x-1 sm:space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Statutory & Operational Reports (14)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reconciliation'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Payment & Claim Reconciliation</span>
          {initialAudit.discrepancy_count > 0 ? (
            <Badge variant="danger" size="sm">
              {initialAudit.discrepancy_count}
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              Healthy
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cashflow')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'cashflow'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
          }`}
        >
          <ArrowUpDown className="h-4 w-4" />
          <span>Cash Flow & Transactions</span>
          <span className="text-xs text-text-muted">({transactions.length})</span>
        </button>
      </div>

      {/* 3. Active Tab View */}
      {activeTab === 'reports' && (
        <section aria-label="Reports Viewer">
          <ReportViewer initialReport={initialReport} />
        </section>
      )}

      {activeTab === 'reconciliation' && (
        <section aria-label="Reconciliation Engine">
          <ReconciliationView initialAudit={initialAudit} />
        </section>
      )}

      {activeTab === 'cashflow' && (
        <section aria-label="Cash Flow Transactions" className="space-y-4">
          <Card className="border border-border shadow-card">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-text-muted" />
                    Treasury & Supplier Transaction Log
                  </CardTitle>
                  <CardDescription className="text-xs text-text-secondary">
                    Immutable history of all payment disbursements and treasury reimbursement
                    receipts
                  </CardDescription>
                </div>
                <div className="text-xs text-text-muted">
                  Total Logged:{' '}
                  <span className="font-semibold text-text-primary">{transactions.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="border border-border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs font-semibold py-2.5">Voucher / Ref</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Flow Type</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Counterparty</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Method</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-right py-2.5">
                        Amount (PKR)
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Authorized By</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-text-muted text-xs">
                          No financial transactions recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((tx) => (
                        <TableRow
                          key={tx.id}
                          className="hover:bg-slate-50 transition-colors duration-150 text-xs"
                        >
                          <TableCell className="font-mono font-medium text-text-primary">
                            {tx.voucher_or_ref}
                          </TableCell>
                          <TableCell>
                            {tx.transaction_type === 'disbursement' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                <ArrowUpRight className="h-3 w-3" />
                                Disbursement
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                <ArrowDownLeft className="h-3 w-3" />
                                Treasury Receipt
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-text-secondary">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-text-muted" />
                              <span>{tx.counterparty}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize text-text-muted">
                            {tx.payment_method.replace('_', ' ')}
                          </TableCell>
                          <TableCell className="font-mono text-text-muted">
                            {tx.transaction_date}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-text-primary">
                            Rs. {tx.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-text-secondary">{tx.operator_name}</TableCell>
                          <TableCell className="text-text-muted max-w-xs truncate">
                            {tx.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
