'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MedicineBatch } from '@/modules/inventory/types';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';
import { calculateDaysUntilExpiry } from '@/modules/inventory/alerts';

interface BatchesTableProps {
  initialData: {
    batches: (MedicineBatch & {
      medicine_name?: string;
      strength?: string;
      dosage_form?: string;
    })[];
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
  currentSearch?: string;
  currentStatus?: string;
  currentExpiryWindow?: string;
}

export function BatchesTable({
  initialData,
  currentSearch = '',
  currentStatus = 'all',
  currentExpiryWindow = 'all',
}: BatchesTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [statusFilter, setStatusFilter] = useState(currentStatus);
  const [expiryFilter, setExpiryFilter] = useState(currentExpiryWindow);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('tab', 'batches');
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (expiryFilter !== 'all') params.set('expiry_window', expiryFilter);
    params.set('page', '1');
    router.push(`/inventory?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('tab', 'batches');
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (expiryFilter !== 'all') params.set('expiry_window', expiryFilter);
    params.set('page', newPage.toString());
    router.push(`/inventory?${params.toString()}`);
  };

  const getStatusBadge = (batch: MedicineBatch) => {
    const days = calculateDaysUntilExpiry(batch.expiry_date);

    if (batch.status === 'quarantined') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Quarantined
        </span>
      );
    }

    if (batch.status === 'expired' || days <= 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Expired
        </span>
      );
    }

    if (days <= 60) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Near Expiry ({days}d)
        </span>
      );
    }

    if (batch.status === 'depleted' || batch.quantity_on_hand === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700">
          Depleted
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Available ({days}d)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Form */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
          >
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                <Input
                  placeholder="Search by batch number, medicine name, strength..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  const params = new URLSearchParams();
                  params.set('tab', 'batches');
                  if (searchTerm.trim()) params.set('search', searchTerm.trim());
                  if (e.target.value !== 'all') params.set('status', e.target.value);
                  if (expiryFilter !== 'all') params.set('expiry_window', expiryFilter);
                  params.set('page', '1');
                  router.push(`/inventory?${params.toString()}`);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary"
              >
                <option value="all">All Batch Statuses</option>
                <option value="available">Available Only</option>
                <option value="quarantined">Quarantined Only</option>
                <option value="expired">Expired Only</option>
                <option value="depleted">Depleted</option>
              </select>

              {/* Expiry Window Filter */}
              <select
                value={expiryFilter}
                onChange={(e) => {
                  setExpiryFilter(e.target.value);
                  const params = new URLSearchParams();
                  params.set('tab', 'batches');
                  if (searchTerm.trim()) params.set('search', searchTerm.trim());
                  if (statusFilter !== 'all') params.set('status', statusFilter);
                  if (e.target.value !== 'all') params.set('expiry_window', e.target.value);
                  params.set('page', '1');
                  router.push(`/inventory?${params.toString()}`);
                }}
                className="h-10 px-3 text-sm rounded-lg border border-border bg-white text-text-primary"
              >
                <option value="all">All Expiry Windows</option>
                <option value="near_expiry">Expiring Within 60 Days</option>
                <option value="expired">Already Expired</option>
                <option value="valid">Valid Beyond 60 Days</option>
              </select>

              <Button type="submit" variant="secondary" className="h-10">
                Apply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Batches Table Card */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface-muted/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-primary">
              All Medicine Batches ({initialData.totalRecords})
            </CardTitle>
          </div>
          <span className="text-xs text-text-muted font-mono">
            Page {initialData.currentPage} of {initialData.totalPages}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {initialData.batches.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Layers}
                title="No batches found"
                description={
                  searchTerm
                    ? `No batches matching "${searchTerm}". Try checking filters.`
                    : 'No inventory batches recorded yet.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted/20">
                    <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider">
                      Batch #
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Medicine Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Formulation
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Expiry Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                      Stock on Hand
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                      Unit Cost
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                      Status / FEFO
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.batches.map((batch) => (
                    <TableRow
                      key={batch.id}
                      className="hover:bg-surface-muted/40 transition-colors"
                    >
                      <TableCell className="font-mono text-xs font-bold text-text-primary">
                        {batch.batch_number}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/medicines/${batch.medicine_id}`}
                          className="font-medium text-text-primary hover:text-primary transition-colors text-sm"
                        >
                          {batch.medicine_name || 'Medicine'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {batch.dosage_form} • {batch.strength}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-secondary">
                        {batch.expiry_date}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-text-primary">
                        {batch.quantity_on_hand}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-text-secondary">
                        PKR {batch.unit_cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(batch)}</TableCell>
                      <TableCell className="text-right">
                        <StockAdjustmentDialog batch={batch} medicineName={batch.medicine_name} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {initialData.totalPages > 1 && (
            <div className="py-3 px-4 border-t border-border/60 bg-surface-muted/10 flex items-center justify-between text-xs text-text-muted">
              <span>
                Showing {(initialData.currentPage - 1) * initialData.pageSize + 1}–
                {Math.min(initialData.currentPage * initialData.pageSize, initialData.totalRecords)}{' '}
                of {initialData.totalRecords} batches
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={initialData.currentPage <= 1}
                  onClick={() => handlePageChange(initialData.currentPage - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <div className="px-2 font-medium text-text-primary">
                  {initialData.currentPage} / {initialData.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={initialData.currentPage >= initialData.totalPages}
                  onClick={() => handlePageChange(initialData.currentPage + 1)}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
