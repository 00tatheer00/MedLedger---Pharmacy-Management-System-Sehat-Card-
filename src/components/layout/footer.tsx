import Link from 'next/link';
import { Cross, ShieldCheck, HeartPulse, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/95 text-slate-600 text-xs py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Hospital Affiliation */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs">
            <Cross className="h-3.5 w-3.5 rotate-45 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs">MedLedger</span>
              <span className="inline-flex items-center gap-1 rounded bg-teal-50 text-teal-700 px-1.5 py-0.5 text-[10px] font-semibold border border-teal-200">
                <ShieldCheck className="h-3 w-3" />
                DHQ Hospital Kohat
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Department of Health • Government of Khyber Pakhtunkhwa
            </span>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-medium text-slate-500">
          <Link href="/" className="hover:text-teal-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/dispensing" className="hover:text-teal-600 transition-colors">
            ⚡ Fast Counter
          </Link>
          <Link href="/admissions" className="hover:text-teal-600 transition-colors">
            Admissions
          </Link>
          <Link href="/inventory" className="hover:text-teal-600 transition-colors">
            Inventory
          </Link>
          <Link href="/claims" className="hover:text-teal-600 transition-colors">
            SSP Claims
          </Link>
          <Link href="/medicines" className="hover:text-teal-600 transition-colors">
            Formulary
          </Link>
          <Link href="/settings" className="hover:text-teal-600 transition-colors">
            Settings
          </Link>
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-600 transition-colors inline-flex items-center gap-1"
          >
            <span>Status</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Dynamic Copyright Year & Credits */}
        <div className="text-[11px] text-slate-400 text-center md:text-right">
          <p>© {currentYear} DHQ Hospital Kohat. All rights reserved.</p>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center md:justify-end gap-1">
            <span>Powered by Tech4Edges</span>
            <HeartPulse className="h-2.5 w-2.5 text-rose-500 inline" />
            <span>Sehat Sahulat Program</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
