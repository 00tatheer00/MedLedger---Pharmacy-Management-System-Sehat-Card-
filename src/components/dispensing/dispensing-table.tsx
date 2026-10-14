'use client';

/**
 * MedLedger — Dispensing History & Audit Log Table
 *
 * Displays chronological log of medicine dispensations with search,
 * status filters, receipt viewing, and authorized reversal triggers.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatPKR } from '@/lib/decimal';
import { DispensingWithDetails, DispensingStatus } from '@/modules/dispensing/types';
import { DispensingReceiptDialog } from './dispensing-receipt-dialog';
import { ReverseDispensingDialog } from './reverse-dispensing-dialog';

interface DispensingTableProps {
  initialRecords: DispensingWithDetails[];
}

export function DispensingTable({ initialRecords }: DispensingTableProps) {
  const [records, setRecords] = useState<DispensingWithDetails[]>(initialRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DispensingStatus>('all');

  // Dialog states
  const [selectedReceiptRecord, setSelectedReceiptRecord] = useState<DispensingWithDetails | null>(
    null,
  );
  const [selectedReverseRecord, setSelectedReverseRecord] = useState<DispensingWithDetails | null>(
    null,
  );

  const filtered = records.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      r.dispensing_number.toLowerCase().includes(term) ||
      r.prescription_number.toLowerCase().includes(term) ||
      r.patient_name.toLowerCase().includes(term) ||
      r.mr_number.toLowerCase().includes(term) ||
      (r.ward && r.ward.toLowerCase().includes(term))
    );
  });

  function handleReversalSuccess(updated: DispensingWithDetails) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Input
            type="search"
            placeholder="Search by voucher #, MRN, patient, or slip..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs pl-3 pr-8 py-2"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="dispensing-status-select" className="text-xs text-slate-500 font-medium">
            Status:
          </label>
          <select
            id="dispensing-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | DispensingStatus)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Records</option>
            <option value="completed">Completed Only</option>
            <option value="reversed">Reversed / Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Voucher #</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Patient</th>
                <th className="p-3">Prescription</th>
                <th className="p-3 text-center">Items</th>
                <th className="p-3 text-right">Gross Total</th>
                <th className="p-3">Dispensed By</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No dispensing records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const isReversed = record.status === 'reversed';
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="p-3 font-mono font-semibold text-primary">
                        <Link href={`/dispensing/${record.id}`} className="hover:underline">
                          {record.dispensing_number}
                        </Link>
                      </td>
                      <td className="p-3 text-slate-600">
                        {new Date(record.dispensed_at).toLocaleString('en-PK', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{record.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {record.mr_number}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-slate-800">{record.prescription_number}</div>
                        <div className="text-[11px] text-slate-500">
                          {record.ward || 'Outpatient (OPD)'}
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {record.items.length}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-900">
                        {formatPKR(record.total_amount)}
                      </td>
                      <td className="p-3 text-slate-700">{record.dispensed_by_name}</td>
                      <td className="p-3 text-center">
                        <Badge variant={isReversed ? 'danger' : 'success'}>
                          {isReversed ? 'Reversed' : 'Completed'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReceiptRecord(record)}
                            className="h-7 px-2 text-xs gap-1"
                            title="Print Receipt Voucher"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Receipt
                          </Button>

                          <Link href={`/dispensing/${record.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </Button>
                          </Link>

                          {!isReversed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedReverseRecord(record)}
                              className="h-7 px-2 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                              title="Compensating Reversal"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reverse
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <DispensingReceiptDialog
        open={Boolean(selectedReceiptRecord)}
        onClose={() => setSelectedReceiptRecord(null)}
        record={selectedReceiptRecord}
      />

      {/* Reversal Confirmation Modal */}
      <ReverseDispensingDialog
        open={Boolean(selectedReverseRecord)}
        onClose={() => setSelectedReverseRecord(null)}
        record={selectedReverseRecord}
        onReversalSuccess={handleReversalSuccess}
      />
    </div>
  );
}
