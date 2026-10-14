'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface UpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * UpdatePrompt Component
 *
 * Floating update alert styled to notify the user whenever a new deployment
 * or service worker version is detected. Matches the high-priority enterprise design.
 */
export function UpdatePrompt({ onUpdate, onDismiss, className = '' }: UpdatePromptProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = () => {
    setIsUpdating(true);
    onUpdate();
  };

  return (
    <aside
      role="alert"
      aria-live="assertive"
      aria-label="New application version available"
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-[430px] w-[calc(100%-2.5rem)] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto ${className}`}
    >
      <div className="relative flex items-center justify-between gap-3 bg-[#eef7ff] border border-sky-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xl shadow-sky-950/10 backdrop-blur-xs">
        {/* Top-left circular close button with blue (x) */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close update notification"
          className="absolute -top-2.5 -left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-sky-200 shadow-sm text-sky-500 hover:text-sky-700 hover:bg-sky-50 active:scale-95 transition-all cursor-pointer"
        >
          <X className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>

        {/* Info Icon in solid blue circle */}
        <div className="flex shrink-0 items-center justify-center" aria-hidden="true">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0284c7] text-white shadow-xs">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Notification details */}
        <div className="min-w-0 flex-1 pr-1">
          <h4 className="text-sm font-bold text-[#0284c7] leading-tight">New Version Available</h4>
          <p className="text-[12px] sm:text-[13px] text-[#0284c7]/95 font-medium leading-snug mt-0.5">
            A new update is available. Refresh to load the latest changes.
          </p>
        </div>

        {/* Update Now Action Button */}
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isUpdating}
          className="shrink-0 rounded-lg bg-[#18181b] hover:bg-black active:scale-[0.98] text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Update Now'}
        </button>
      </div>
    </aside>
  );
}
