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
import { ReportId, ReportExecutionResult, ReportFilterParams } from '@/modules/reports/types';
import { REPORT_REGISTRY } from '@/modules/reports/generators';
import { generateReportAction, exportReportCsvAction } from '@/modules/reports/actions';
import {
  FileText,
  Download,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface ReportViewerProps {
  initialReport: ReportExecutionResult;
}

export function ReportViewer({ initialReport }: ReportViewerProps) {
  const [selectedReportId, setSelectedReportId] = useState<ReportId>(initialReport.metadata.id);
  const [reportData, setReportData] = useState<ReportExecutionResult>(initialReport);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'operational' | 'financial'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const availableReports = Object.values(REPORT_REGISTRY).filter((r) => {
    if (categoryFilter === 'all') return true;
    return r.category === categoryFilter;
  });

  const handleRunReport = (reportIdToRun: ReportId = selectedReportId) => {
    startTransition(async () => {
      const filters: ReportFilterParams = {};
      if (searchTerm.trim()) filters.search = searchTerm.trim();
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const res = await generateReportAction(reportIdToRun, filters);
      if (res.success && res.data) {
        setReportData(res.data);
      }
    });
  };

  const handleSelectReport = (newId: ReportId) => {
    setSelectedReportId(newId);
    handleRunReport(newId);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const filters: ReportFilterParams = {};
      if (searchTerm.trim()) filters.search = searchTerm.trim();
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const res = await exportReportCsvAction(selectedReportId, filters);
      if (res.success && res.csvContent && res.filename) {
        // Trigger browser file download
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportNotice(
          `Exported ${res.totalRecords ?? reportData.total_records} rows successfully.`,
        );
        setTimeout(() => setExportNotice(null), 4000);
      } else {
        alert(res.error || 'Failed to export CSV report.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const renderCellValue = (
    row: Record<string, unknown>,
    key: string,
    format?: 'currency' | 'number' | 'date' | 'badge' | 'text',
  ) => {
    const val = row[key];
    if (val === null || val === undefined) return '—';

    if (format === 'currency') {
      const num = Number(val);
      return (
        <span className="font-mono font-medium text-text-primary">
          Rs. {num.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
        </span>
      );
    }

    if (format === 'number') {
      const num = Number(val);
      return <span className="font-mono">{num.toLocaleString('en-PK')}</span>;
    }

    if (format === 'badge') {
      const str = String(val);
      const isNegative =
        str.toLowerCase().includes('reject') ||
        str.toLowerCase().includes('deficit') ||
        str.toLowerCase().includes('out of stock') ||
        str.toLowerCase().includes('critical') ||
        str.toLowerCase().includes('expired') ||
        str.toLowerCase().includes('discrepancy');

      const isWarning =
        str.toLowerCase().includes('pending') ||
        str.toLowerCase().includes('low stock') ||
        str.toLowerCase().includes('unallocated') ||
        str.toLowerCase().includes('expiring') ||
        str.toLowerCase().includes('returned') ||
        str.toLowerCase().includes('under_review');

      return (
        <Badge variant={isNegative ? 'danger' : isWarning ? 'warning' : 'success'} size="sm">
          {str}
        </Badge>
      );
    }

    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* 1. Report Selector & Category Switcher */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Hospital Operational & Financial Registry
              </CardTitle>
              <CardDescription className="text-xs">
                Authoritative multi-module reports generated from live database records with zero
                floating-point estimation.
              </CardDescription>
            </div>
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-card-bg text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                All (14)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('operational')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  categoryFilter === 'operational'
                    ? 'bg-card-bg text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Operational (6)
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('financial')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  categoryFilter === 'financial'
                    ? 'bg-card-bg text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Financial (8)
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {availableReports.map((meta) => {
              const isSelected = meta.id === selectedReportId;
              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => handleSelectReport(meta.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary shadow-xs'
                      : 'border-border/70 hover:border-border hover:bg-surface-muted/50 text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="truncate pr-1">{meta.title}</span>
                    <Badge variant={meta.category === 'operational' ? 'muted' : 'info'} size="sm">
                      {meta.category === 'operational' ? 'Ops' : 'Fin'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted line-clamp-2">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Active Report Header & Controls Bar */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-lg font-semibold text-text-primary">
                  {reportData.metadata.title}
                </h3>
                <Badge
                  variant={reportData.metadata.category === 'operational' ? 'default' : 'info'}
                  size="sm"
                >
                  {reportData.metadata.category.toUpperCase()}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-text-secondary">{reportData.metadata.description}</p>
            </div>

            {/* Actions: Refresh & CSV Export */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRunReport()}
                disabled={isPending}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Download className="h-3.5 w-3.5" />
                {isExporting ? 'Exporting...' : 'Export CSV (RFC 4180)'}
              </Button>
            </div>
          </div>

          {exportNotice && (
            <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {exportNotice}
            </div>
          )}
        </CardHeader>

        {/* Filters Toolbar */}
        <div className="p-4 bg-surface-muted/40 border-b border-border/60">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-text-muted" />
                <Input
                  placeholder="Filter records by name, reference, ward, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunReport();
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Date From */}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-text-muted shrink-0" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 text-xs w-36"
                  placeholder="Date From"
                />
              </div>

              {/* Date To */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 text-xs w-36"
                  placeholder="Date To"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleRunReport()}
              disabled={isPending}
              className="gap-1.5 text-xs h-9 shrink-0"
            >
              <Filter className="h-3.5 w-3.5" />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* 3. Summary Stats Pills */}
        {reportData.summary_stats.length > 0 && (
          <div className="p-4 bg-card-bg border-b border-border/60">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {reportData.summary_stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-surface-muted/50 p-3 rounded-lg border border-border/60"
                >
                  <span className="text-[11px] font-medium text-text-muted block">
                    {stat.label}
                  </span>
                  <span className="text-base font-bold font-mono text-text-primary mt-1 block">
                    {stat.format === 'currency'
                      ? `Rs. ${Number(stat.value).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
                      : typeof stat.value === 'number'
                        ? Number(stat.value).toLocaleString('en-PK')
                        : stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Dynamic Data Table */}
        <CardContent className="p-0">
          {reportData.rows.length === 0 ? (
            <div className="py-12 text-center text-text-muted space-y-2">
              <Layers className="h-8 w-8 mx-auto text-text-muted/60" />
              <p className="text-sm font-medium">No matching records found for this period.</p>
              <p className="text-xs">Adjust your search term or date filters to view records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted/60">
                    {reportData.metadata.columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className={`text-xs font-semibold ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                        }`}
                      >
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.rows.map((row, rIdx) => (
                    <TableRow key={rIdx} className="hover:bg-surface-muted/30">
                      {reportData.metadata.columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={`text-xs py-2.5 ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                          }`}
                        >
                          {renderCellValue(row, col.key, col.format)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Table Footer Meta */}
          <div className="px-4 py-3 bg-surface-muted/30 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span>
              Total records:{' '}
              <strong className="text-text-primary">{reportData.total_records}</strong>
            </span>
            <span>
              Generated at:{' '}
              <span className="font-mono">
                {reportData.generated_at.slice(0, 19).replace('T', ' ')}
              </span>{' '}
              by {reportData.generated_by}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
