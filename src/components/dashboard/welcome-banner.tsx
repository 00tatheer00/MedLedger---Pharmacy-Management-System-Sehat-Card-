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
    <div className="rounded-xl border border-teal-200 bg-teal-700 px-5 py-5 sm:px-6 sm:py-5 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          {/* Hospital & Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-teal-800 px-2.5 py-0.5 rounded-md text-teal-100 border border-teal-600">
              <Building2 className="h-3 w-3 text-teal-300" />
              DHQ Hospital Kohat • مرکزی فارمیسی
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-emerald-800 px-2.5 py-0.5 rounded-md text-emerald-100 border border-emerald-600">
              <CheckCircle2 className="h-3 w-3 text-emerald-300" />
              {isLiveDatabase ? 'Live Supabase Connected' : 'Live Counter Active'}
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
              Welcome back, Dr. Ayesha Khan
            </h2>
            <p className="text-xs text-teal-200 font-normal mt-0.5 max-w-xl">
              Central Hospital Dispensary &amp; Inventory Control — Managing OPD/IPD stock, Sehat
              Card, and claims.
            </p>
          </div>

          {/* Quick Info Tags */}
          <div className="flex items-center gap-2 pt-0.5 flex-wrap text-[11px]">
            <span className="inline-flex items-center gap-1 font-medium bg-teal-800 px-2.5 py-0.5 rounded-md text-teal-200 border border-teal-600">
              <HeartPulse className="h-3 w-3 text-teal-300" />
              OPD &amp; Emergency Ready
            </span>
            <span className="inline-flex items-center gap-1 font-medium bg-teal-800 px-2.5 py-0.5 rounded-md text-teal-200 border border-teal-600">
              <ShieldCheck className="h-3 w-3 text-teal-300" />
              KP Sehat Sahulat Program
            </span>
          </div>
        </div>

        {/* Date / Calendar Widget */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-1 shrink-0 rounded-lg bg-teal-800 px-4 py-3 border border-teal-600">
          <div className="flex items-center gap-1.5 text-teal-300">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase font-medium tracking-wider">
              Today&apos;s Shift
            </span>
          </div>
          <div className="text-sm font-medium text-white text-right">
            {formattedDate || 'DHQ Kohat Central Pharmacy'}
          </div>
        </div>
      </div>
    </div>
  );
}
