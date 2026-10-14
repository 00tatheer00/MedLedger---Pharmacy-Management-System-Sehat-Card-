'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { priorityAlerts, type AlertItem } from '@/lib/demo-data';

export function PriorityAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  return (
    <>
      <Card>
        <CardHeader className="px-4 py-3 border-b border-border/80 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-danger" />
            <CardTitle className="text-sm font-bold text-text-primary">
              Priority Alerts & Clinical Notifications
            </CardTitle>
          </div>
          <Badge variant="warning" size="sm" className="text-[10px]">
            {priorityAlerts.length} Flagged • Simulated
          </Badge>
        </CardHeader>
        <CardContent className="p-3 sm:p-3.5 space-y-2.5">
          {priorityAlerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity}
              title={alert.title}
              description={alert.description}
              className="py-2.5 px-3"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAlert(alert)}
                  className="h-6.5 text-[11px] px-2 font-medium"
                >
                  Inspect
                </Button>
              }
            />
          ))}
        </CardContent>
      </Card>

      {/* Alert Inspection Dialog (Honest Prototype) */}
      <Dialog
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.title || 'Alert Details'}
        description={`Severity: ${selectedAlert?.severity?.toUpperCase()} • Timestamp: ${selectedAlert?.timestamp}`}
        footer={
          <Button variant="primary" size="sm" onClick={() => setSelectedAlert(null)}>
            Dismiss View
          </Button>
        }
      >
        <div className="space-y-3 py-1">
          <div className="rounded-lg bg-page-bg p-3 border border-border text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-text-muted">Notification ID:</span>
              <span className="font-mono text-text-primary">{selectedAlert?.id} (Fictional)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Recorded Timestamp:</span>
              <span className="text-text-primary">{selectedAlert?.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Classification:</span>
              <span className="font-semibold capitalize text-text-primary">
                {selectedAlert?.severity}
              </span>
            </div>
          </div>

          <div className="text-xs text-text-secondary leading-relaxed">
            <p className="font-semibold text-text-primary mb-1">Alert Description:</p>
            <p>{selectedAlert?.description}</p>
          </div>

          <div className="rounded-md border border-info/30 bg-info-light/40 p-2.5 text-[11px] text-blue-900 leading-normal">
            ℹ️ <strong>Prototype Note:</strong> In Phase 3 and Phase 4, taking action on this alert
            will trigger batch quarantine, automated purchase order creation, or claim dispute
            submission.
          </div>
        </div>
      </Dialog>
    </>
  );
}
