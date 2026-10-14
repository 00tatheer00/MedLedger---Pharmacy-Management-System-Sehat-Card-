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
          iconBg: 'bg-rose-100',
          border: 'border-rose-200 hover:border-rose-400',
          badge: 'Critical • فوری توجہ',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          actionText: 'Resolve',
          actionHref: '/inventory',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100',
          border: 'border-amber-200 hover:border-amber-400',
          badge: 'Warning • توجہ طلب',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          actionText: 'Check',
          actionHref: '/inventory',
          btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          border: 'border-blue-200 hover:border-blue-400',
          badge: 'Info • نوٹس',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          actionText: 'Review',
          actionHref: '/claims',
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  return (
    <>
      <Card className="h-full border border-white/70 bg-white/75 backdrop-blur-2xl rounded-[28px] shadow-[0_10px_32px_0_rgba(15,23,42,0.04),inset_0_1px_1px_0_rgba(255,255,255,0.95)]">
        <CardHeader className="px-5 py-4 border-b border-border/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 shadow-[0_0_14px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-text-primary">
                Urgent Pharmacy Alerts
              </CardTitle>
              <p className="text-xs text-text-secondary font-medium">
                فوری انتباہات — Requires staff intervention
              </p>
            </div>
          </div>
          <span className="bg-rose-500/12 text-rose-800 border border-rose-400/40 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-2xs">
            {priorityAlerts.length} Flagged
          </span>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          {priorityAlerts.map((alert) => {
            const config = getSeverityConfig(alert.severity);
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[20px] border bg-white/60 backdrop-blur-xl shadow-xs transition-all duration-300 ease-out group hover:-translate-y-1 hover:bg-white/85 hover:shadow-apple-float cursor-pointer ios-press ${config.border}`}
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
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${config.iconBg} ${config.iconColor} shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-2xs ${config.badgeClass}`}
                      >
                        {config.badge}
                      </span>
                      <span className="text-xs text-text-muted font-mono">
                        {alert.timestamp.slice(0, 10)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary mb-0.5 group-hover:text-primary transition-colors">
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
                    className="font-bold text-xs h-8.5 px-3.5 rounded-full border hover:border-primary shadow-2xs"
                  >
                    Details
                  </Button>
                  <Link
                    href={config.actionHref}
                    onClick={(e) => e.stopPropagation()}
                    className={`font-bold text-xs h-8.5 px-3 rounded-lg flex items-center gap-1 shadow-xs transition-colors ${config.btnClass}`}
                  >
                    <span>{config.actionText}</span>
                    <ArrowRight className="h-3 w-3" />
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-xs transition-colors"
              onClick={() => setSelectedAlert(null)}
            >
              <span>Take Operational Action</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        }
      >
        <div className="space-y-3.5 py-2">
          <div className="rounded-xl bg-page-bg p-3.5 border border-border text-xs sm:text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted font-medium">Alert ID:</span>
              <span className="font-mono font-bold text-text-primary">{selectedAlert?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-medium">Recorded Date:</span>
              <span className="text-text-primary font-semibold">{selectedAlert?.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted font-medium">Priority Level:</span>
              <span className="font-bold capitalize text-rose-700">{selectedAlert?.severity}</span>
            </div>
          </div>

          <div className="text-sm text-text-primary leading-relaxed bg-card-bg p-3.5 rounded-xl border border-border">
            <p className="font-bold mb-1">Issue Summary:</p>
            <p className="text-text-secondary text-xs sm:text-sm">{selectedAlert?.description}</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-900 leading-relaxed">
            ✅ <strong>Recommended Action:</strong> Check the central warehouse store or initiate a
            purchase order to maintain minimum emergency reserve levels.
          </div>
        </div>
      </Dialog>
    </>
  );
}
