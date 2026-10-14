'use client';

import { useSyncExternalStore } from 'react';
import { Calendar, Building2, Sparkles, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const subscribe = () => () => {};

function getSnapshot() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function getServerSnapshot() {
  return '';
}

interface WelcomeBannerProps {
  isLiveDatabase?: boolean;
}

export function WelcomeBanner({ isLiveDatabase = false }: WelcomeBannerProps) {
  const formattedDate = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border bg-gradient-to-r from-card-bg via-card-bg to-page-bg/90 px-4 py-3 sm:py-3.5 shadow-2xs">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary">
            Welcome back, Dr. Ayesha
          </h2>
          <Badge variant="info" size="sm" className="gap-1 font-semibold text-[11px] py-0.2">
            <Building2 className="h-3 w-3" />
            DHQ Hospital Kohat
          </Badge>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-teal font-medium bg-teal/10 px-2 py-0.5 rounded-full">
            {isLiveDatabase ? (
              <>
                <Database className="h-2.5 w-2.5 text-success" />
                Live Supabase Connected
              </>
            ) : (
              <>
                <Sparkles className="h-2.5 w-2.5" />
                Phase 4 App Integration
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-text-secondary">
          Central Inpatient & Outpatient Dispensary • Operational stock, claims, and dispensing
          journal.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto rounded-lg border border-border bg-card-bg px-2.5 py-1.5 text-xs text-text-secondary shadow-2xs">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-text-primary text-xs">
          {formattedDate || 'DHQ Kohat Central Pharmacy'}
        </span>
      </div>
    </div>
  );
}
