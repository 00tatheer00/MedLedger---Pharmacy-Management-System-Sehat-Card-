import { ShieldCheck, Database } from 'lucide-react';

interface PrototypeBannerProps {
  isLiveDatabase?: boolean;
  sourceNotice?: string;
}

export function PrototypeBanner({ isLiveDatabase = false, sourceNotice }: PrototypeBannerProps) {
  return (
    <div className="rounded-[28px] border border-white/60 border-t-white/90 bg-gradient-to-br from-white/55 via-white/42 to-white/30 backdrop-blur-3xl px-5 sm:px-6 py-4 sm:py-5 text-sm text-text-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_24px_50px_-10px_rgba(0,0,0,0.32),inset_0_1.5px_2px_0_rgba(255,255,255,0.9)]">
      <div className="flex items-start gap-3">
        {isLiveDatabase ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 shadow-[0_0_14px_rgba(16,185,129,0.25)] shrink-0">
            <Database className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/15 text-teal shadow-[0_0_14px_rgba(20,184,166,0.25)] shrink-0">
            <ShieldCheck className="h-5 w-5" />
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
      <div className="shrink-0 text-xs font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-500/15 border border-teal-400/30 px-4 py-2 rounded-full backdrop-blur-md shadow-2xs">
        {isLiveDatabase ? 'Supabase Live • v0.4.0' : 'v0.4.0 • Phase 4'}
      </div>
    </div>
  );
}
