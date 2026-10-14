'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  ReconciliationAuditReport,
  ReconciliationItem,
  ReconciliationStatus,
} from '@/modules/finance/types';
import { runReconciliationAuditAction } from '@/modules/finance/actions';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface ReconciliationViewProps {
  initialAudit: ReconciliationAuditReport;
}

export function ReconciliationView({ initialAudit }: ReconciliationViewProps) {
  const [auditReport, setAuditReport] = useState<ReconciliationAuditReport>(initialAudit);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReconciliationStatus>('all');
  const [flowFilter, setFlowFilter] = useState<
    'all' | 'supplier_payment' | 'hospital_claim_receipt'
  >('all');
  const [notice, setNotice] = useState<string | null>(null);

  const handleRunAudit = () => {
    startTransition(async () => {
      setNotice(null);
      const res = await runReconciliationAuditAction();
      if (res.success && res.data) {
        setAuditReport(res.data);
        setNotice(
          res.data.is_healthy
            ? 'Audit completed successfully: 0 discrepancies detected across all records.'
            : `Audit completed: ${res.data.discrepancy_count} discrepancies require review.`,
        );
      } else {
        setNotice(res.error || 'Failed to execute reconciliation audit.');
      }
    });
  };

  const filteredItems = auditReport.items.filter((item: ReconciliationItem) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (flowFilter !== 'all' && item.flow_type !== flowFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchRef = item.reference.toLowerCase().includes(q);
      const matchCounterparty = item.counterparty.toLowerCase().includes(q);
      const matchDetails = item.discrepancy_details?.toLowerCase().includes(q) ?? false;
      if (!matchRef && !matchCounterparty && !matchDetails) return false;
    }
    return true;
  });

  const getStatusBadge = (status: ReconciliationStatus) => {
    switch (status) {
      case 'fully_allocated':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Fully Allocated
          </Badge>
        );
      case 'partially_allocated':
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <Clock className="h-3 w-3" />
            Partially Allocated
          </Badge>
        );
      case 'unallocated':
        return (
          <Badge variant="muted" size="sm" className="gap-1">
            <Layers className="h-3 w-3" />
            Unallocated
          </Badge>
        );
      case 'discrepancy':
        return (
          <Badge variant="danger" size="sm" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Discrepancy
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Audit Health Banner */}
      <Card
        className={`border shadow-xs ${
          auditReport.is_healthy
            ? 'border-emerald-200 bg-emerald-50/40'
            : 'border-amber-200 bg-amber-50/40'
        }`}
      >
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  auditReport.is_healthy
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {auditReport.is_healthy ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  {auditReport.is_healthy
                    ? 'All Ledger Accounts Balanced & Reconciled'
                    : 'Financial Discrepancies Requiring Reconciliation'}
                  <Badge variant={auditReport.is_healthy ? 'success' : 'danger'} size="sm">
                    {auditReport.is_healthy ? 'HEALTHY' : 'ATTENTION REQUIRED'}
                  </Badge>
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Last verified on{' '}
                  <span className="font-medium text-text-primary">
                    {new Date(auditReport.audit_date).toLocaleString()}
                  </span>{' '}
                  by <span className="font-medium text-text-primary">{auditReport.audited_by}</span>
                  .
                  {auditReport.is_healthy
                    ? ' Zero mathematical drift or unauthorized over-allocations detected in supplier invoices and claims.'
                    : ` Found ${auditReport.discrepancy_count} transactions with over-allocation or missing linkage.`}
                </p>
              </div>
            </div>

            <Button
              variant={auditReport.is_healthy ? 'outline' : 'primary'}
              size="sm"
              onClick={handleRunAudit}
              disabled={isPending}
              className="gap-2 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              {isPending ? 'Auditing Ledger...' : 'Run Live Audit'}
            </Button>
          </div>

          {notice && (
            <div
              className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                notice.includes('0 discrepancies')
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Audit Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border border-border/70 p-3 shadow-xs">
          <p className="text-xs text-text-muted font-medium">Analyzed</p>
          <p className="text-xl font-bold font-mono text-text-primary mt-1">
            {auditReport.total_transactions_analyzed}
          </p>
          <span className="text-[11px] text-text-secondary">Total transactions</span>
        </Card>

        <Card className="border border-border/70 p-3 shadow-xs bg-emerald-50/20">
          <p className="text-xs text-emerald-700 font-medium">Fully Allocated</p>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {auditReport.fully_allocated_count}
          </p>
          <span className="text-[11px] text-emerald-600">100% matched</span>
        </Card>

        <Card className="border border-border/70 p-3 shadow-xs bg-amber-50/20">
          <p className="text-xs text-amber-700 font-medium">Partially Allocated</p>
          <p className="text-xl font-bold font-mono text-amber-700 mt-1">
            {auditReport.partially_allocated_count}
          </p>
          <span className="text-[11px] text-amber-600">Pending balance</span>
        </Card>

        <Card className="border border-border/70 p-3 shadow-xs">
          <p className="text-xs text-text-muted font-medium">Unallocated</p>
          <p className="text-xl font-bold font-mono text-text-secondary mt-1">
            {auditReport.unallocated_count}
          </p>
          <span className="text-[11px] text-text-muted">Unapplied funds</span>
        </Card>

        <Card
          className={`border p-3 shadow-xs ${
            auditReport.discrepancy_count > 0
              ? 'border-red-300 bg-red-50/50 text-red-700'
              : 'border-border/70'
          }`}
        >
          <p
            className={`text-xs font-medium ${
              auditReport.discrepancy_count > 0 ? 'text-red-700' : 'text-text-muted'
            }`}
          >
            Discrepancies
          </p>
          <p
            className={`text-xl font-bold font-mono mt-1 ${
              auditReport.discrepancy_count > 0 ? 'text-red-700' : 'text-text-primary'
            }`}
          >
            {auditReport.discrepancy_count}
          </p>
          <span className="text-[11px] text-text-secondary">Integrity violations</span>
        </Card>

        <Card className="border border-border/70 p-3 shadow-xs">
          <p className="text-xs text-text-muted font-medium">Unallocated Cash</p>
          <p className="text-lg font-bold font-mono text-text-primary mt-1">
            Rs. {auditReport.total_unallocated_amount.toLocaleString('en-PK')}
          </p>
          <span className="text-[11px] text-text-secondary">Awaiting invoice link</span>
        </Card>
      </div>

      {/* 3. Filter and Search Controls */}
      <Card className="border border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Filter className="h-4 w-4 text-text-muted" />
                Reconciliation Audit Ledger
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Filter and inspect individual disbursement vouchers and treasury receipts
              </CardDescription>
            </div>
            <div className="text-xs font-medium text-text-muted">
              Showing {filteredItems.length} of {auditReport.items.length} items
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search by voucher / claim number, supplier or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by Reconciliation Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | ReconciliationStatus)}
                className="h-9 px-3 text-xs rounded-md border border-border bg-card-bg text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="fully_allocated">Fully Allocated</option>
                <option value="partially_allocated">Partially Allocated</option>
                <option value="unallocated">Unallocated</option>
                <option value="discrepancy">Discrepancy</option>
              </select>

              <select
                aria-label="Filter by Flow Type"
                value={flowFilter}
                onChange={(e) =>
                  setFlowFilter(
                    e.target.value as 'all' | 'supplier_payment' | 'hospital_claim_receipt',
                  )
                }
                className="h-9 px-3 text-xs rounded-md border border-border bg-card-bg text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Flow Types</option>
                <option value="supplier_payment">Supplier Payment (Disbursement)</option>
                <option value="hospital_claim_receipt">Claim Receipt (Reimbursement)</option>
              </select>

              {(searchTerm || statusFilter !== 'all' || flowFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setFlowFilter('all');
                  }}
                  className="h-9 text-xs text-text-muted"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* 4. Transactions Table */}
          <div className="border border-border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-secondary">
                  <TableHead className="text-xs font-semibold py-2.5">
                    Reference / Voucher
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-2.5">Type & Flow</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5">Counterparty</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-right py-2.5">
                    Recorded (PKR)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right py-2.5">
                    Allocated (PKR)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right py-2.5">
                    Unallocated (PKR)
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-center py-2.5">Status</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5">Audit Findings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-text-muted text-xs">
                      No reconciliation items match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-hover-bg/40 text-xs">
                      <TableCell className="font-mono font-medium text-text-primary">
                        {item.reference}
                      </TableCell>
                      <TableCell>
                        {item.flow_type === 'supplier_payment' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            <ArrowUpRight className="h-3 w-3" />
                            Disbursement
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            <ArrowDownLeft className="h-3 w-3" />
                            Claim Receipt
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-text-secondary">
                        {item.counterparty}
                      </TableCell>
                      <TableCell className="text-text-muted font-mono">
                        {item.transaction_date}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-text-primary">
                        {item.recorded_amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-700">
                        {item.allocated_amount.toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-text-muted">
                        {item.unallocated_amount > 0 ? (
                          <span className="text-amber-700 font-medium">
                            {item.unallocated_amount.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          '0.00'
                        )}
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate text-text-muted">
                        {item.discrepancy_details ? (
                          <span className="text-red-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {item.discrepancy_details}
                          </span>
                        ) : item.unallocated_amount > 0 ? (
                          <span className="text-amber-600">
                            Pending allocation to specific invoices
                          </span>
                        ) : (
                          <span className="text-text-muted">Balanced</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
