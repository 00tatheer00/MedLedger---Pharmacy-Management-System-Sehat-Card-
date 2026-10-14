'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full max-w-lg rounded-xl border border-border bg-white p-6 sm:p-7 shadow-dropdown',
          'animate-in zoom-in-95 duration-150',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h3 id="dialog-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary rounded-lg hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {children && <div className="py-4 text-sm text-text-primary">{children}</div>}

        {footer && (
          <div className="mt-3 flex items-center justify-end gap-3 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
