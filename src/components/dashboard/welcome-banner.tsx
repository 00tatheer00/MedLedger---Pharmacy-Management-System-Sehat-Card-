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
    <div className="relative overflow-hidden rounded-3xl border-2 border-teal-600/30 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 px-6 py-7 sm:px-8 sm:py-8 shadow-xl text-white">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-emerald-400/10 rounded-full blur-xl translate-y-1/3 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          {/* Hospital & Status badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold bg-white/20 border border-white/30 px-3.5 py-1.5 rounded-full text-white backdrop-blur-md shadow-sm">
              <Building2 className="h-4 w-4 text-emerald-200" />
              DHQ Hospital Kohat • ڈسٹرکٹ ہیڈ کوارٹر ہسپتال کوہاٹ
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold bg-emerald-400/25 border border-emerald-300/40 px-3.5 py-1.5 rounded-full text-emerald-100 backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              {isLiveDatabase ? 'Live Supabase Connected' : 'Live Pharmacy Counter Active'}
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Welcome back, Dr. Ayesha Khan 👋
            </h2>
            <p className="text-base sm:text-lg text-emerald-50/90 font-medium mt-1 max-w-2xl">
              Central Hospital Dispensary & Inventory Control — Dispensary, Sehat Card, and
              Procurement System.
            </p>
          </div>

          {/* Quick Counter Info Pills */}
          <div className="flex items-center gap-3 pt-1 flex-wrap text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 font-bold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
              <HeartPulse className="h-4 w-4 text-emerald-300" />
              OPD & Emergency Dispensary Ready
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
              <ShieldCheck className="h-4 w-4 text-teal-200" />
              Khyber Pakhtunkhwa Sehat Sahulat Program
            </span>
          </div>
        </div>

        {/* Date / Calendar Widget */}
        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 shrink-0 rounded-2xl bg-white/15 backdrop-blur-md px-5 py-4 border border-white/20 shadow-inner">
          <div className="flex items-center gap-2 text-emerald-200">
            <Calendar className="h-5 w-5" />
            <span className="text-xs uppercase font-extrabold tracking-wider">
              Today&apos;s Shift
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-white text-right">
            {formattedDate || 'DHQ Kohat Central Pharmacy'}
          </div>
        </div>
      </div>
    </div>
  );
}
