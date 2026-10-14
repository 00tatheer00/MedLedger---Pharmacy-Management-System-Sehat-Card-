'use client';

import { useState } from 'react';
import { Activity, ArrowDownLeft, ArrowUpRight, RefreshCw, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { recentActivity, type ActivityItem } from '@/lib/demo-data';

export function RecentActivityTable() {
  const [filter, setFilter] = useState<string>('all');

  const filteredItems = recentActivity.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'dispensing') return item.type === 'dispensing';
    if (filter === 'receipt') return item.type === 'receipt';
    if (filter === 'adjustment') return item.type === 'adjustment';
    return true;
  });

  const getTypeBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'receipt':
        return (
          <Badge variant="info" size="sm" className="gap-1">
            <ArrowDownLeft className="h-3 w-3" />
            Receipt
          </Badge>
        );
      case 'dispensing':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <ArrowUpRight className="h-3 w-3" />
            Dispensed
          </Badge>
        );
      case 'adjustment':
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Adjustment
          </Badge>
        );
      case 'return':
        return (
          <Badge variant="default" size="sm" className="gap-1">
            <FileText className="h-3 w-3" />
            Return
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: ActivityItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" size="sm">
            ✓ Done
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            ⏳ Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" size="sm">
            ✕ Cancelled
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base font-semibold text-text-primary">
            Recent Activity
          </CardTitle>
        </div>

        {/* Filter tabs */}
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3 py-1">
              All ({recentActivity.length})
            </TabsTrigger>
            <TabsTrigger value="dispensing" className="text-xs px-3 py-1">
              Dispensing
            </TabsTrigger>
            <TabsTrigger value="receipt" className="text-xs px-3 py-1">
              Receipts
            </TabsTrigger>
            <TabsTrigger value="adjustment" className="text-xs px-3 py-1">
              Adjustments
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[130px] py-2.5 px-4 text-xs">Reference #</TableHead>
                <TableHead className="w-[130px] py-2.5 px-4 text-xs">Activity Type</TableHead>
                <TableHead className="py-2.5 px-4 text-xs">Summary</TableHead>
                <TableHead className="w-[100px] py-2.5 px-4 text-xs">Date</TableHead>
                <TableHead className="w-[100px] py-2.5 px-4 text-right text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="transition-colors duration-100 hover:bg-slate-50 cursor-default"
                >
                  <TableCell className="font-mono text-xs font-medium text-text-primary py-3 px-4">
                    {item.refNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4">{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="text-sm text-text-secondary max-w-md truncate py-3 px-4">
                    {item.summary}
                  </TableCell>
                  <TableCell className="text-xs text-text-muted whitespace-nowrap py-3 px-4">
                    {item.date}
                  </TableCell>
                  <TableCell className="text-right py-3 px-4">
                    {getStatusBadge(item.status)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-text-muted">
                    No transactions match the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50 text-sm text-text-secondary">
          <span className="text-xs">
            Showing <strong className="text-text-primary">{filteredItems.length}</strong> of{' '}
            <strong className="text-text-primary">{recentActivity.length}</strong> activities
          </span>
          <span className="text-[11px] text-text-muted font-mono">Page 1 of 1 • Journal View</span>
        </div>
      </CardContent>
    </Card>
  );
}
