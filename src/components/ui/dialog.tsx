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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-200"
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
          'relative w-full max-w-lg rounded-2xl border border-border bg-card-bg p-6 sm:p-8 shadow-dropdown',
          'animate-in zoom-in-95 duration-200',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-border">
          <div>
            <h3 id="dialog-title" className="text-xl font-bold text-text-primary">
              {title}
            </h3>
            {description && (
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0 text-text-muted hover:text-text-primary rounded-xl"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {children && <div className="py-5 text-base text-text-primary">{children}</div>}

        {footer && (
          <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
