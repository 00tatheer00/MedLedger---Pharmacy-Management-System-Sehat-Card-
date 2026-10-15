import Link from 'next/link';
import { ArrowLeft, Home, Zap, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600" />

        {/* 404 Visual Indicator */}
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 mb-4 shadow-xs">
          <span className="text-3xl font-black tracking-tight">404</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Page Not Found • صفحہ موجود نہیں ہے
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          The requested page could not be located in the DHQ Hospital Kohat pharmacy system. It may
          have been moved, renamed, or you may have followed an outdated clinical link.
        </p>

        {/* Quick Primary Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full gap-2 font-semibold">
              <Home className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
          <Link href="/dispensing" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold"
            >
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>⚡ Fast Counter</span>
            </Button>
          </Link>
        </div>

        {/* Helpful Shortcuts Strip */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
          <Link
            href="/inventory"
            className="p-2.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all flex flex-col items-center gap-1 text-slate-600"
          >
            <Package className="h-4 w-4 text-teal-600" />
            <span className="font-medium text-[11px]">Inventory</span>
          </Link>
          <Link
            href="/admissions"
            className="p-2.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all flex flex-col items-center gap-1 text-slate-600"
          >
            <Search className="h-4 w-4 text-teal-600" />
            <span className="font-medium text-[11px]">Admissions</span>
          </Link>
          <Link
            href="/claims"
            className="p-2.5 rounded-xl border border-slate-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all flex flex-col items-center gap-1 text-slate-600"
          >
            <ArrowLeft className="h-4 w-4 text-teal-600" />
            <span className="font-medium text-[11px]">SSP Claims</span>
          </Link>
        </div>

        <div className="mt-6 text-[11px] text-slate-400">
          DHQ Hospital Kohat • MedLedger Pharmacy Information System
        </div>
      </div>
    </div>
  );
}
