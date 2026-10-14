import { ShieldCheck, Database } from 'lucide-react';

interface PrototypeBannerProps {
  isLiveDatabase?: boolean;
  sourceNotice?: string;
}

export function PrototypeBanner({ isLiveDatabase = false, sourceNotice }: PrototypeBannerProps) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary-light/30 px-3.5 py-2.5 text-xs text-text-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
      <div className="flex items-start gap-2.5">
        {isLiveDatabase ? (
          <Database className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5">
          <p className="font-semibold text-text-primary text-xs">
            MedLedger Evaluation Environment • DHQ Hospital Kohat
          </p>
          <p className="text-[11px] text-text-secondary leading-normal">
            {sourceNotice ||
              'All records, batch numbers, and PKR amounts are simulated demonstration records for UI evaluation. No real patient data or backend mutations exist.'}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-[10px] font-mono text-primary font-bold uppercase tracking-wider bg-card-bg/90 border border-primary/20 px-2 py-0.5 rounded">
        {isLiveDatabase ? 'Supabase Live • v0.4.0' : 'v0.4.0 • Integrated Phase 4'}
      </div>
    </div>
  );
}
