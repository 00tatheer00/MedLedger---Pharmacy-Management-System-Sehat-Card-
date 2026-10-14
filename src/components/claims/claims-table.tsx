'use client';

/**
 * MedLedger — Hospital Claims Queue Table
 *
 * Filterable, searchable queue of reimbursement claims submitted to DHQ Hospital.
 * Displays line item counts, financial totals, status badges, and action triggers.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Eye, CheckCircle, CreditCard, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatPKR } from '@/lib/decimal';
import { ClaimWithDetails, ClaimStatus } from '@/modules/claims/types';
import { ClaimReviewDialog } from './claim-review-dialog';
import { ClaimPaymentDialog } from './claim-payment-dialog';

interface ClaimsTableProps {
  initialClaims: ClaimWithDetails[];
}

export function ClaimsTable({ initialClaims }: ClaimsTableProps) {
  const [claims, setClaims] = useState<ClaimWithDetails[]>(initialClaims);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog triggers
  const [reviewingClaim, setReviewingClaim] = useState<ClaimWithDetails | null>(null);
  const [payingClaim, setPayingClaim] = useState<ClaimWithDetails | null>(null);

  const filtered = claims.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    return (
      c.claim_number.toLowerCase().includes(term) ||
      (c.submitted_by_name && c.submitted_by_name.toLowerCase().includes(term)) ||
      c.items.some(
        (it) =>
          it.patient_name.toLowerCase().includes(term) ||
          it.mr_number.toLowerCase().includes(term) ||
          it.dispensing_number.toLowerCase().includes(term) ||
          it.medicine_name.toLowerCase().includes(term),
      )
    );
  });

  function getStatusBadge(status: ClaimStatus) {
    switch (status) {
      case 'draft':
        return <Badge variant="muted">Draft</Badge>;
      case 'submitted':
        return <Badge variant="info">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="warning">Under Review</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'partially_approved':
        return <Badge variant="info">Partially Approved</Badge>;
      case 'partially_paid':
        return <Badge variant="warning">Partially Paid</Badge>;
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'returned':
        return <Badge variant="warning">Returned</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="muted">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  }

  function handleClaimUpdated(updated: ClaimWithDetails) {
    setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <div className="space-y-4">
      {/* Search & Status Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            id="claims-search-input"
            type="text"
            placeholder="Search claim #, patient, MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {[
            { key: 'all', label: 'All' },
            { key: 'submitted', label: 'Submitted' },
            { key: 'under_review', label: 'In Review' },
            { key: 'approved', label: 'Approved' },
            { key: 'partially_paid', label: 'Partial Paid' },
            { key: 'paid', label: 'Paid' },
            { key: 'returned', label: 'Returned' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'draft', label: 'Draft' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-150 whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List Table */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Claim Reference</th>
                <th className="px-4 py-3">Claim Period</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-right">Submitted</th>
                <th className="px-4 py-3 text-right">Approved</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No reimbursement claims found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm
                        ? 'Try adjusting your search criteria'
                        : 'Prepare a new claim from finalized dispensing records to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline block"
                      >
                        {claim.claim_number}
                      </Link>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {claim.submitted_by_name || 'Unsubmitted draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <div>
                        {claim.claim_period_start} → {claim.claim_period_end}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {claim.patient_count} {claim.patient_count === 1 ? 'patient' : 'patients'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs font-medium text-slate-700">
                      {claim.total_items}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatPKR(claim.total_amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {claim.approved_amount > 0 ? formatPKR(claim.approved_amount) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-indigo-700 whitespace-nowrap">
                      {claim.paid_amount > 0 ? formatPKR(claim.paid_amount) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {claim.approved_amount > 0 ? formatPKR(claim.outstanding_balance) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/claims/${claim.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2.5 text-slate-600">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </Link>

                        {/* Review Action Trigger */}
                        {['submitted', 'under_review'].includes(claim.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReviewingClaim(claim)}
                            className="h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Review
                          </Button>
                        )}

                        {/* Payment Action Trigger */}
                        {['approved', 'partially_approved', 'partially_paid'].includes(
                          claim.status,
                        ) &&
                          claim.outstanding_balance > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPayingClaim(claim)}
                              className="h-8 px-2.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              Pay
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Dialog */}
      {reviewingClaim && (
        <ClaimReviewDialog
          claim={reviewingClaim}
          isOpen={!!reviewingClaim}
          onClose={() => setReviewingClaim(null)}
          onSuccess={(updated) => {
            handleClaimUpdated(updated);
            setReviewingClaim(null);
          }}
        />
      )}

      {/* Payment Dialog */}
      {payingClaim && (
        <ClaimPaymentDialog
          claim={payingClaim}
          isOpen={!!payingClaim}
          onClose={() => setPayingClaim(null)}
          onSuccess={(updated) => {
            handleClaimUpdated(updated);
            setPayingClaim(null);
          }}
        />
      )}
    </div>
  );
}
