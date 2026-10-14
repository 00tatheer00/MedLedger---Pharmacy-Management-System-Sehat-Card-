'use client';

import { useSyncExternalStore } from 'react';
import { Calendar, Building2, CheckCircle2, ShieldCheck, HeartPulse } from 'lucide-react';

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

export function WelcomeBanner({ isLiveDatabase = true }: WelcomeBannerProps) {
  const formattedDate = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-teal-600/30 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 px-5 py-5 sm:px-6 sm:py-5.5 shadow-lg text-white">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-emerald-400/10 rounded-full blur-xl translate-y-1/3 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          {/* Hospital & Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 border border-white/30 px-3 py-1 rounded-full text-white backdrop-blur-md shadow-sm">
              <Building2 className="h-3.5 w-3.5 text-emerald-200" />
              DHQ Hospital Kohat • مرکزی فارمیسی
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-400/25 border border-emerald-300/40 px-3 py-1 rounded-full text-emerald-100 backdrop-blur-md">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              {isLiveDatabase ? 'Live Supabase Connected' : 'Live Counter Active'}
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              Welcome back, Dr. Ayesha Khan 👋
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50/90 font-medium mt-0.5 max-w-xl">
              Central Hospital Dispensary & Inventory Control — Managing OPD/IPD stock, Sehat Card,
              and claims.
            </p>
          </div>

          {/* Quick Info Tags */}
          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1 font-semibold bg-white/15 px-2.5 py-1 rounded-lg border border-white/20">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-300" />
              OPD & Emergency Ready
            </span>
            <span className="inline-flex items-center gap-1 font-semibold bg-white/15 px-2.5 py-1 rounded-lg border border-white/20">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-200" />
              KP Sehat Sahulat Program
            </span>
          </div>
        </div>

        {/* Date / Calendar Widget */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-1 shrink-0 rounded-xl bg-white/15 backdrop-blur-md px-4 py-3 border border-white/20 shadow-inner">
          <div className="flex items-center gap-1.5 text-emerald-200">
            <Calendar className="h-4 w-4" />
            <span className="text-[11px] uppercase font-bold tracking-wider">
              Today&apos;s Shift
            </span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white text-right">
            {formattedDate || 'DHQ Kohat Central Pharmacy'}
          </div>
        </div>
      </div>
    </div>
  );
}
