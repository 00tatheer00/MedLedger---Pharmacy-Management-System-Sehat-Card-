'use client';

import Link from 'next/link';
import { AlertTriangle, XCircle, Clock, ArrowRight, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InventoryAlert } from '@/modules/inventory/types';

interface AlertsViewProps {
  alerts: InventoryAlert[];
}

export function AlertsView({ alerts }: AlertsViewProps) {
  if (alerts.length === 0) {
    return (
      <Card className="border border-border p-8 shadow-card">
        <EmptyState
          icon={Package}
          title="All inventory parameters healthy"
          description="No low-stock, out-of-stock, or near-expiry batches detected at this time."
        />
      </Card>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');
  const infoAlerts = alerts.filter((a) => a.severity === 'info');

  const renderAlertCard = (alert: InventoryAlert) => {
    let icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
    let border = 'border-amber-200 bg-amber-50 hover:border-amber-300';
    let badgeText = 'Warning';
    let badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300';

    if (alert.severity === 'critical') {
      icon = <XCircle className="w-4 h-4 text-rose-600" />;
      border = 'border-rose-200 bg-rose-50 hover:border-rose-300';
      badgeText = 'Critical Alert';
      badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300';
    } else if (alert.severity === 'info') {
      icon = <Clock className="w-4 h-4 text-blue-600" />;
      border = 'border-blue-200 bg-blue-50 hover:border-blue-300';
      badgeText = 'FEFO Surveillance';
      badgeStyle = 'bg-blue-100 text-blue-800 border-blue-300';
    }

    return (
      <div
        key={alert.id}
        className={`p-4 rounded-xl border ${border} shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs transition-all duration-150`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${badgeStyle}`}
              >
                {badgeText}
              </span>
              <span className="font-bold text-text-primary text-sm">
                {alert.medicine_name} ({alert.strength})
              </span>
              {alert.batch_number && (
                <span className="font-mono text-text-muted">Batch: {alert.batch_number}</span>
              )}
            </div>
            <p className="text-text-secondary mt-1 leading-relaxed">{alert.message}</p>
          </div>
        </div>

        <Link
          href={`/medicines/${alert.medicine_id}`}
          className={buttonVariants({
            variant: 'outline',
            size: 'sm',
            className:
              'h-8 px-3 text-xs font-semibold gap-1 shrink-0 bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all duration-150',
          })}
        >
          Inspect & Adjust
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {criticalAlerts.length > 0 && (
        <Card className="border border-rose-200 bg-white shadow-card overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-rose-200 bg-rose-50">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <CardTitle className="text-sm font-semibold text-rose-900">
                Critical Surveillance Action Required ({criticalAlerts.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">{criticalAlerts.map(renderAlertCard)}</CardContent>
        </Card>
      )}

      {warningAlerts.length > 0 && (
        <Card className="border border-amber-200 bg-white shadow-card overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-sm font-semibold text-amber-900">
                Low Stock & Threshold Warnings ({warningAlerts.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">{warningAlerts.map(renderAlertCard)}</CardContent>
        </Card>
      )}

      {infoAlerts.length > 0 && (
        <Card className="border border-blue-200 bg-white shadow-card overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-semibold text-blue-900">
                Upcoming Expiry Horizon & FEFO Monitoring ({infoAlerts.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">{infoAlerts.map(renderAlertCard)}</CardContent>
        </Card>
      )}
    </div>
  );
}
