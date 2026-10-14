import { ShieldCheck, Database } from 'lucide-react';

interface PrototypeBannerProps {
  isLiveDatabase?: boolean;
  sourceNotice?: string;
}

export function PrototypeBanner({ isLiveDatabase = false, sourceNotice }: PrototypeBannerProps) {
  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary-light/40 to-card-bg px-5 sm:px-6 py-4 sm:py-5 text-sm text-text-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-start gap-3">
        {isLiveDatabase ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 shrink-0">
            <Database className="h-5 w-5 text-emerald-600" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="space-y-1">
          <p className="font-bold text-text-primary text-base">MedLedger — DHQ Hospital Kohat</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {sourceNotice ||
              'All records, batch numbers, and PKR amounts are simulated demonstration records for UI evaluation.'}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-xs font-mono font-bold uppercase tracking-wider text-primary bg-primary-light/60 border border-primary/20 px-4 py-2 rounded-xl">
        {isLiveDatabase ? 'Supabase Live • v0.4.0' : 'v0.4.0 • Phase 4'}
      </div>
    </div>
  );
}
