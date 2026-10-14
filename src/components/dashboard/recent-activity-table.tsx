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
          <Badge variant="info" size="sm" className="gap-1.5 font-bold">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Receipt
          </Badge>
        );
      case 'dispensing':
        return (
          <Badge variant="success" size="sm" className="gap-1.5 font-bold">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Dispensed
          </Badge>
        );
      case 'adjustment':
        return (
          <Badge variant="warning" size="sm" className="gap-1.5 font-bold">
            <RefreshCw className="h-3.5 w-3.5" />
            Adjustment
          </Badge>
        );
      case 'return':
        return (
          <Badge variant="default" size="sm" className="gap-1.5 font-bold">
            <FileText className="h-3.5 w-3.5" />
            Return
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: ActivityItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" size="sm" className="font-bold">
            ✓ Done
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm" className="font-bold">
            ⏳ Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" size="sm" className="font-bold">
            ✕ Cancelled
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-bold text-text-primary">Recent Activity</CardTitle>
        </div>

        {/* Filter tabs */}
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="h-10">
            <TabsTrigger value="all" className="text-sm px-4 py-1.5 font-semibold">
              All ({recentActivity.length})
            </TabsTrigger>
            <TabsTrigger value="dispensing" className="text-sm px-4 py-1.5 font-semibold">
              Dispensing
            </TabsTrigger>
            <TabsTrigger value="receipt" className="text-sm px-4 py-1.5 font-semibold">
              Receipts
            </TabsTrigger>
            <TabsTrigger value="adjustment" className="text-sm px-4 py-1.5 font-semibold">
              Adjustments
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-page-bg/60">
                <TableHead className="w-[140px] py-3.5 px-5 text-sm font-bold">
                  Reference #
                </TableHead>
                <TableHead className="w-[150px] py-3.5 px-5 text-sm font-bold">
                  Activity Type
                </TableHead>
                <TableHead className="py-3.5 px-5 text-sm font-bold">Summary</TableHead>
                <TableHead className="w-[120px] py-3.5 px-5 text-sm font-bold">Date</TableHead>
                <TableHead className="w-[110px] py-3.5 px-5 text-right text-sm font-bold">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-hover-bg transition-colors duration-150 cursor-default"
                >
                  <TableCell className="font-mono text-sm font-bold text-text-primary py-4 px-5">
                    {item.refNumber}
                  </TableCell>
                  <TableCell className="py-4 px-5">{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="text-sm text-text-secondary max-w-md truncate py-4 px-5">
                    {item.summary}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary whitespace-nowrap py-4 px-5">
                    {item.date}
                  </TableCell>
                  <TableCell className="text-right py-4 px-5">
                    {getStatusBadge(item.status)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-sm text-text-muted">
                    No transactions match the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-page-bg/40 text-sm text-text-secondary">
          <span>
            Showing <strong className="text-text-primary">{filteredItems.length}</strong> of{' '}
            <strong className="text-text-primary">{recentActivity.length}</strong> activities
          </span>
          <span className="text-xs text-text-muted font-mono font-bold">
            Page 1 of 1 • Journal View
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
