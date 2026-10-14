'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { priorityAlerts, AlertSeverity } from '@/lib/demo-data';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  CheckCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [alerts] = useState(priorityAlerts);
  const [filterSeverity, setFilterSeverity] = useState<'all' | AlertSeverity>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeAlerts = alerts.filter(
    (a) => !dismissedIds.has(a.id) && (filterSeverity === 'all' || a.severity === filterSeverity),
  );

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleMarkAllRead = () => {
    setDismissedIds(new Set(alerts.map((a) => a.id)));
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="danger" size="sm" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Critical
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" size="sm" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        );
      case 'info':
        return (
          <Badge variant="info" size="sm" className="gap-1">
            <Info className="h-3 w-3" />
            Information
          </Badge>
        );
    }
  };

  return (
    <AppShell
      title="System Notifications & Alerts"
      subtitle="DHQ Hospital Kohat — Clinical & Inventory Surveillance"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications & Clinical Alerts Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time threshold surveillance: stock deficits, batch expiration horizons, and
              clinical alerts.
            </p>
          </div>

          {activeAlerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="gap-1.5 text-xs shrink-0"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filterSeverity === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterSeverity('all')}
            className="text-xs h-8"
          >
            All Alerts ({alerts.filter((a) => !dismissedIds.has(a.id)).length})
          </Button>
          <Button
            variant={filterSeverity === 'critical' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterSeverity('critical')}
            className="text-xs h-8"
          >
            Critical (
            {alerts.filter((a) => !dismissedIds.has(a.id) && a.severity === 'critical').length})
          </Button>
          <Button
            variant={filterSeverity === 'warning' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterSeverity('warning')}
            className="text-xs h-8"
          >
            Warnings (
            {alerts.filter((a) => !dismissedIds.has(a.id) && a.severity === 'warning').length})
          </Button>
          <Button
            variant={filterSeverity === 'info' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterSeverity('info')}
            className="text-xs h-8"
          >
            Info ({alerts.filter((a) => !dismissedIds.has(a.id) && a.severity === 'info').length})
          </Button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {activeAlerts.length === 0 ? (
            <Card className="border border-border/70 p-12 text-center shadow-xs">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-text-primary">All Clear</h3>
                <p className="text-xs text-text-secondary max-w-sm">
                  There are no active unacknowledged notifications matching your criteria.
                  Surveillance systems are operating normally.
                </p>
              </div>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border shadow-xs transition-colors ${
                  alert.severity === 'critical'
                    ? 'border-red-200 bg-red-50/20'
                    : alert.severity === 'warning'
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-border/70'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getSeverityBadge(alert.severity)}</div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{alert.title}</h4>
                        <p className="text-xs text-text-secondary mt-0.5">{alert.description}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-text-muted font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link href="/inventory">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Inspect Inventory
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(alert.id)}
                        className="h-7 text-xs text-text-muted hover:text-text-primary"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
