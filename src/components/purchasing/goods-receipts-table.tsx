'use client';

/**
 * MedLedger — Goods Receipt Notes (GRN) Table Component
 *
 * Displays chronological physical intake records against supplier consignments.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PackageCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginatedGoodsReceiptsResponse } from '@/modules/purchasing/types';
import { formatPKR } from '@/lib/decimal';

interface GoodsReceiptsTableProps {
  initialData: PaginatedGoodsReceiptsResponse;
  currentSearch?: string;
}

export function GoodsReceiptsTable({ initialData, currentSearch = '' }: GoodsReceiptsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    params.set('tab', 'receipts');
    params.set('page', '1');
    router.push(`/purchases?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    params.set('tab', 'receipts');
    params.set('page', String(newPage));
    router.push(`/purchases?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
              <Input
                placeholder="Search by GRN number, PO number, delivery challan, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
            <Button type="submit" variant="secondary" className="h-10">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface-muted/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-text-primary">
              Goods Receipt Notes Archive ({initialData.totalRecords})
            </CardTitle>
          </div>
          <span className="text-xs text-text-muted font-mono">
            Page {initialData.currentPage} of {initialData.totalPages}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {initialData.receipts.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <PackageCheck className="w-10 h-10 text-text-muted/50 mx-auto" />
              <p className="text-base font-medium text-text-primary">No goods receipts found</p>
              <p className="text-sm text-text-muted">
                {searchTerm
                  ? `No receipts matching "${searchTerm}".`
                  : 'No goods receipts have been logged yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-muted/20">
                    <TableHead className="w-[140px]">GRN Number</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Linked PO</TableHead>
                    <TableHead>Distributor / Supplier</TableHead>
                    <TableHead>Challan Ref</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead className="text-center">Lots / Items</TableHead>
                    <TableHead className="text-right">Total Intake Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.receipts.map((grn) => {
                    const totalCost = grn.items.reduce((sum, i) => sum + i.total_cost, 0);
                    const totalAcceptedUnits = grn.items.reduce(
                      (sum, i) => sum + i.quantity_accepted,
                      0,
                    );

                    return (
                      <TableRow key={grn.id} className="hover:bg-surface-muted/30">
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          {grn.grn_number}
                        </TableCell>
                        <TableCell className="text-xs text-text-secondary">
                          {grn.received_date}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {grn.purchase_order_id ? (
                            <Link
                              href={`/purchases/${grn.purchase_order_id}`}
                              className="text-primary hover:underline font-semibold"
                            >
                              {grn.purchase_order_number || 'View PO'}
                            </Link>
                          ) : (
                            <span className="text-text-muted">Direct Receipt</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-text-primary">
                          {grn.supplier_name || '—'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-text-muted">
                          {grn.delivery_challan_number || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-text-secondary">
                          {grn.received_by_name || 'Staff'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-text-secondary">
                          {totalAcceptedUnits} units ({grn.items.length} lots)
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-xs text-text-primary">
                          {formatPKR(totalCost)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {initialData.totalPages > 1 && (
            <div className="py-3 px-4 border-t border-border/60 bg-surface-muted/10 flex items-center justify-between text-xs text-text-muted">
              <span>
                Showing {(initialData.currentPage - 1) * initialData.pageSize + 1}–
                {Math.min(initialData.currentPage * initialData.pageSize, initialData.totalRecords)}{' '}
                of {initialData.totalRecords} receipts
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
