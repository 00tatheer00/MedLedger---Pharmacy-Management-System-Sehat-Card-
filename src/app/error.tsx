'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Next.js Dashboard Error Boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-light text-danger mb-4 ring-8 ring-danger-light/40">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-bold text-text-primary tracking-tight">
        Pharmacy System Encountered an Error
      </h2>

      <p className="mt-2 text-sm text-text-secondary max-w-md leading-relaxed">
        {error.message ||
          'An unexpected error occurred while loading pharmacy operations data. Clinical records remain protected.'}
      </p>

      {error.digest && (
        <span className="mt-2 text-[11px] font-mono text-text-muted bg-page-bg px-2 py-0.5 rounded border border-border">
          Error Digest: {error.digest}
        </span>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => reset()} variant="primary" size="md" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry Operation
        </Button>
        <Link href="/">
          <Button variant="outline" size="md" className="gap-2">
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </Link>
      </div>

      <p className="mt-8 text-[11px] text-text-muted">
        DHQ Hospital Kohat • Central Pharmacy System • Phase 4 Protected Boundary
      </p>
    </div>
  );
}
