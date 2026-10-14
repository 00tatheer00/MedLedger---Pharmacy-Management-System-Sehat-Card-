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
          <Badge variant="info" size="sm" className="gap-1 font-semibold text-[11px] py-0.2">
            <ArrowDownLeft className="h-3 w-3 text-primary" />
            Stock Receipt
          </Badge>
        );
      case 'dispensing':
        return (
          <Badge variant="success" size="sm" className="gap-1 font-semibold text-[11px] py-0.2">
            <ArrowUpRight className="h-3 w-3 text-success" />
            Dispensed
          </Badge>
        );
      case 'adjustment':
        return (
          <Badge variant="warning" size="sm" className="gap-1 font-semibold text-[11px] py-0.2">
            <RefreshCw className="h-3 w-3 text-warning" />
            Adjustment
          </Badge>
        );
      case 'return':
        return (
          <Badge variant="default" size="sm" className="gap-1 font-semibold text-[11px] py-0.2">
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
          <Badge variant="success" size="sm" className="text-[10px] py-0.2">
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm" className="text-[10px] py-0.2">
            Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" size="sm" className="text-[10px] py-0.2">
            Cancelled
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b border-border/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <div>
            <CardTitle className="text-sm font-bold text-text-primary">
              Recent Inventory & Dispensing Activity
            </CardTitle>
          </div>
        </div>

        {/* Filter tabs */}
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-2.5 py-0.5">
              All ({recentActivity.length})
            </TabsTrigger>
            <TabsTrigger value="dispensing" className="text-xs px-2.5 py-0.5">
              Dispensing
            </TabsTrigger>
            <TabsTrigger value="receipt" className="text-xs px-2.5 py-0.5">
              Receipts
            </TabsTrigger>
            <TabsTrigger value="adjustment" className="text-xs px-2.5 py-0.5">
              Adjustments
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-page-bg/40">
                <TableHead className="w-[130px] py-2 px-3.5 text-xs">Reference #</TableHead>
                <TableHead className="w-[140px] py-2 px-3.5 text-xs">Activity Type</TableHead>
                <TableHead className="py-2 px-3.5 text-xs">Transaction Summary</TableHead>
                <TableHead className="w-[110px] py-2 px-3.5 text-xs">Date</TableHead>
                <TableHead className="w-[100px] py-2 px-3.5 text-right text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-hover-bg/70 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-text-primary py-2.5 px-3.5">
                    {item.refNumber}
                  </TableCell>
                  <TableCell className="py-2.5 px-3.5">{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="text-xs text-text-secondary max-w-md truncate py-2.5 px-3.5">
                    {item.summary}
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary whitespace-nowrap py-2.5 px-3.5">
                    {item.date}
                  </TableCell>
                  <TableCell className="text-right py-2.5 px-3.5">
                    {getStatusBadge(item.status)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-xs text-text-muted">
                    No transactions match the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Demo Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-page-bg/30 text-[11px] text-text-secondary">
          <span>
            Showing <strong className="text-text-primary">{filteredItems.length}</strong> of{' '}
            <strong className="text-text-primary">{recentActivity.length}</strong> activities
            (Simulated)
          </span>
          <span className="text-[10px] text-text-muted font-mono">Page 1 of 1 • Journal View</span>
        </div>
      </CardContent>
    </Card>
  );
}
