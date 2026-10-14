'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { priorityAlerts, type AlertItem } from '@/lib/demo-data';

export function PriorityAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          iconColor: 'text-rose-600',
          iconBg: 'bg-rose-50',
          border: 'border-l-rose-500',
          badge: 'Critical • فوری توجہ',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          actionText: 'Resolve',
          actionHref: '/inventory',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-50',
          border: 'border-l-amber-500',
          badge: 'Warning • توجہ طلب',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          actionText: 'Check',
          actionHref: '/inventory',
          btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50',
          border: 'border-l-blue-500',
          badge: 'Info • نوٹس',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          actionText: 'Review',
          actionHref: '/claims',
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="px-5 py-4 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-text-primary">
                Urgent Pharmacy Alerts
              </CardTitle>
              <p className="text-[11px] text-text-muted">
                فوری انتباہات — Requires staff intervention
              </p>
            </div>
          </div>
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] font-medium">
            {priorityAlerts.length} Flagged
          </span>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {priorityAlerts.map((alert) => {
            const config = getSeverityConfig(alert.severity);
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-white group cursor-pointer border-l-[3px] ${config.border} transition-all duration-150 ease-out hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm`}
                onClick={() => setSelectedAlert(alert)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedAlert(alert);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor} shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${config.badgeClass}`}
                      >
                        {config.badge}
                      </span>
                      <span className="text-[11px] text-text-muted font-mono">
                        {alert.timestamp.slice(0, 10)}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-text-primary mb-0.5 group-hover:text-primary transition-colors duration-150">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAlert(alert);
                    }}
                    className="text-xs h-7 px-2.5 rounded-md"
                  >
                    Details
                  </Button>
                  <Link
                    href={config.actionHref}
                    onClick={(e) => e.stopPropagation()}
                    className={`font-medium text-xs h-7 px-2.5 rounded-md flex items-center gap-1 transition-all duration-150 ${config.btnClass}`}
                  >
                    <span>{config.actionText}</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Alert Inspection Dialog */}
      <Dialog
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.title || 'Alert Details'}
        description={`Classification: ${selectedAlert?.severity?.toUpperCase()} • DHQ Kohat Pharmacy`}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="md" onClick={() => setSelectedAlert(null)}>
              Close
            </Button>
            <Link
              href={selectedAlert?.severity === 'critical' ? '/inventory' : '/purchases'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors duration-150"
              onClick={() => setSelectedAlert(null)}
            >
              <span>Take Operational Action</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        }
      >
        <div className="space-y-3 py-1">
          <div className="rounded-lg bg-slate-50 p-3 border border-border text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Alert ID:</span>
              <span className="font-mono font-medium text-text-primary">{selectedAlert?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Recorded Date:</span>
              <span className="text-text-primary">{selectedAlert?.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Priority Level:</span>
              <span className="font-medium capitalize text-rose-700">
                {selectedAlert?.severity}
              </span>
            </div>
          </div>

          <div className="text-sm text-text-primary leading-relaxed bg-white p-3 rounded-lg border border-border">
            <p className="font-medium mb-1">Issue Summary:</p>
            <p className="text-text-secondary text-sm">{selectedAlert?.description}</p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 leading-relaxed">
            ✅ <strong>Recommended Action:</strong> Check the central warehouse store or initiate a
            purchase order to maintain minimum emergency reserve levels.
          </div>
        </div>
      </Dialog>
    </>
  );
}
