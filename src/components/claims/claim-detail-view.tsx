'use client';

/**
 * MedLedger — Hospital Claim Detail View
 *
 * Comprehensive view of an individual reimbursement claim with complete line-item
 * dispensing traceability, financial ledger, approval decision audit, and payment history.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  CreditCard,
  Printer,
  Calendar,
  User,
  CheckSquare,
  Clock,
  Landmark,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { formatPKR } from '@/lib/decimal';
import { ClaimWithDetails, ClaimStatus } from '@/modules/claims/types';
import { submitClaimAction } from '@/modules/claims/actions';
import { ClaimReviewDialog } from './claim-review-dialog';
import { ClaimPaymentDialog } from './claim-payment-dialog';

interface ClaimDetailViewProps {
  initialClaim: ClaimWithDetails;
}

export function ClaimDetailView({ initialClaim }: ClaimDetailViewProps) {
  const [claim, setClaim] = useState<ClaimWithDetails>(initialClaim);
  const [activeTab, setActiveTab] = useState<'items' | 'approvals' | 'payments'>('items');

  // Dialog states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
        return <Badge variant="warning">Returned for Correction</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="muted">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  }

  async function handleSubmitClaim() {
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const res = await submitClaimAction({ claim_id: claim.id });
      if (res.success && res.data) {
        setClaim(res.data);
        setActionMessage('Claim submitted successfully for DHQ Hospital administrative review.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/claims"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Claims Queue
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{claim.claim_number}</h1>
            {getStatusBadge(claim.status)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Billing Period:{' '}
            <span className="font-semibold text-slate-700">{claim.claim_period_start}</span> to{' '}
            <span className="font-semibold text-slate-700">{claim.claim_period_end}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-slate-700 border-slate-200 print:hidden"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Summary
          </Button>

          {/* Submit Action for Draft / Returned */}
          {['draft', 'returned'].includes(claim.status) && (
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmitClaim}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Send className="w-4 h-4 mr-1.5" />
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          )}

          {/* Review Action for Submitted / Under Review */}
          {['submitted', 'under_review'].includes(claim.status) && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsReviewOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Review & Decide
            </Button>
          )}

          {/* Payment Action for Approved / Partially Paid */}
          {['approved', 'partially_approved', 'partially_paid'].includes(claim.status) &&
            claim.outstanding_balance > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsPaymentOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                Record Payment
              </Button>
            )}
        </div>
      </div>

      {actionMessage && <Alert variant="success" title="Update" description={actionMessage} />}

      {/* 4 Financial Highlight Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">
            Submitted Total
          </span>
          <span className="text-xl font-bold text-slate-900 block mt-1">
            {formatPKR(claim.total_amount)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {claim.items.length} line items
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">
            Approved Amount
          </span>
          <span className="text-xl font-bold text-emerald-700 block mt-1">
            {claim.approved_amount > 0 ? formatPKR(claim.approved_amount) : '—'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {claim.approvals.length > 0 ? 'Verified by reviewer' : 'Pending review decision'}
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">
            Reimbursement Paid
          </span>
          <span className="text-xl font-bold text-indigo-700 block mt-1">
            {claim.paid_amount > 0 ? formatPKR(claim.paid_amount) : '—'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {claim.payments.length} installment{claim.payments.length === 1 ? '' : 's'}
          </span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase tracking-wider block">
            Outstanding Balance
          </span>
          <span className="text-xl font-bold text-rose-700 block mt-1">
            {claim.approved_amount > 0 ? formatPKR(claim.outstanding_balance) : '—'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {claim.outstanding_balance <= 0 && claim.approved_amount > 0
              ? 'Fully settled'
              : 'Awaiting hospital disbursement'}
          </span>
        </Card>
      </div>

      {/* Claim Metadata Overview */}
      <Card className="p-4 bg-slate-50 border-slate-200 text-xs text-slate-600">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="font-semibold text-slate-700 block">Submitted By</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{claim.submitted_by_name || 'Unsubmitted draft'}</span>
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">Submission Timestamp</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {claim.submitted_at
                  ? new Date(claim.submitted_at).toLocaleString()
                  : 'Not submitted yet'}
              </span>
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">
              Hospital Administrative Notes
            </span>
            <span className="text-slate-500 italic mt-0.5 block">
              {claim.notes || 'No administrative notes specified.'}
            </span>
          </div>
        </div>
      </Card>

      {/* Detail Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'items'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Claim Line Items ({claim.items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Review & Decision Log ({claim.approvals.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Reimbursement Payments ({claim.payments.length})
        </button>
      </div>

      {/* Tab 1: Line Items */}
      {activeTab === 'items' && (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient / MRN</th>
                  <th className="px-4 py-3">Dispensing Ref</th>
                  <th className="px-4 py-3">Medicine & Dosage</th>
                  <th className="px-4 py-3">Batch & Expiry</th>
                  <th className="px-4 py-3 text-center">Claim Qty</th>
                  <th className="px-4 py-3 text-right">Unit Rate</th>
                  <th className="px-4 py-3 text-right">Total (PKR)</th>
                  <th className="px-4 py-3 text-center">Item Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claim.items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{it.patient_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {it.mr_number} {it.ward ? `• ${it.ward}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      <div>{it.dispensing_number}</div>
                      <div className="text-slate-400">{it.prescription_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{it.medicine_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {it.strength} • {it.dosage_form}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      <div>{it.batch_number}</div>
                      <div className="text-slate-400">Exp: {it.expiry_date}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {it.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatPKR(it.unit_rate)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                      {formatPKR(it.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {it.status === 'approved' ? (
                        <Badge variant="success">Approved</Badge>
                      ) : it.status === 'rejected' ? (
                        <div>
                          <Badge variant="danger">Rejected</Badge>
                          {it.rejection_reason && (
                            <span className="block text-[10px] text-rose-600 mt-0.5">
                              {it.rejection_reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="default">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Approvals Log */}
      {activeTab === 'approvals' && (
        <Card className="p-6 border-slate-200 bg-white shadow-sm space-y-4">
          {claim.approvals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No review decisions recorded yet. Claim is currently awaiting review.
            </div>
          ) : (
            <div className="space-y-4">
              {claim.approvals.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Action: <span className="uppercase text-blue-700">{app.action}</span>
                      </span>
                      <Badge variant="default">Amount: {formatPKR(app.approved_amount)}</Badge>
                    </div>
                    <span className="text-slate-400">
                      {new Date(app.approved_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Reviewer: </span>
                    <span className="text-slate-600">{app.approved_by_name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Reviewer Comments: </span>
                    <span className="text-slate-700 italic">
                      {app.comments || 'No comments provided.'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Payments Log */}
      {activeTab === 'payments' && (
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          {claim.payments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No reimbursement payments recorded for this claim yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3 text-right">Amount (PKR)</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3">Reference / Cheque</th>
                    <th className="px-4 py-3">Received By</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claim.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.payment_date}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 font-mono">
                        {formatPKR(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.payment_method}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {p.reference_number || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.received_by_name}</td>
                      <td className="px-4 py-3 text-slate-500 italic">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Dialogs */}
      {isReviewOpen && (
        <ClaimReviewDialog
          claim={claim}
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onSuccess={(updated) => {
            setClaim(updated);
            setIsReviewOpen(false);
            setActionMessage('Review decision recorded successfully.');
          }}
        />
      )}

      {isPaymentOpen && (
        <ClaimPaymentDialog
          claim={claim}
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={(updated) => {
            setClaim(updated);
            setIsPaymentOpen(false);
            setActionMessage('Reimbursement payment recorded successfully.');
          }}
        />
      )}
    </div>
  );
}
