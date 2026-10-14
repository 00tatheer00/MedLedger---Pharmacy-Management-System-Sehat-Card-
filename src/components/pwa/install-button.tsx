'use client';

import { Download } from 'lucide-react';
import { usePWA } from './pwa-provider';

interface InstallButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar';
}

export function InstallButton({ className = '', variant = 'header' }: InstallButtonProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  if (isInstalled) {
    return null;
  }

  if (variant === 'sidebar') {
    if (!isInstallable) return null;
    return (
      <button
        onClick={promptInstall}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg bg-teal/15 hover:bg-teal/25 text-teal-light text-xs font-bold border border-teal/30 transition-colors cursor-pointer ${className}`}
        aria-label="Install MedLedger PWA"
      >
        <span className="flex items-center gap-2">
          <Download className="h-4 w-4 text-teal" />
          <span>Install App (انسٹال کریں)</span>
        </span>
        <span className="text-[10px] bg-teal text-navy px-1.5 py-0.2 rounded font-extrabold">
          PWA
        </span>
      </button>
    );
  }

  if (!isInstallable) return null;

  return (
    <button
      onClick={promptInstall}
      className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 hover:border-teal-300 text-xs font-semibold transition-all duration-150 shadow-2xs cursor-pointer ${className}`}
      aria-label="Install MedLedger PWA"
    >
      <Download className="h-3.5 w-3.5" />
      <span>Install App</span>
    </button>
  );
}
