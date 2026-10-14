import { ShieldCheck, Database } from 'lucide-react';

interface PrototypeBannerProps {
  isLiveDatabase?: boolean;
  sourceNotice?: string;
}

export function PrototypeBanner({ isLiveDatabase = false, sourceNotice }: PrototypeBannerProps) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4 text-sm text-text-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        {isLiveDatabase ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <Database className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
        )}
        <div className="space-y-0.5">
          <p className="font-medium text-text-primary text-sm">MedLedger — DHQ Hospital Kohat</p>
          <p className="text-xs text-text-muted leading-relaxed">
            {sourceNotice ||
              'All records, batch numbers, and PKR amounts are simulated demonstration records for UI evaluation.'}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-[11px] font-mono font-medium uppercase tracking-wider text-text-muted bg-slate-100 border border-border px-3 py-1.5 rounded-md">
        {isLiveDatabase ? 'Supabase Live • v0.4.0' : 'v0.4.0 • Phase 4'}
      </div>
    </div>
  );
}
