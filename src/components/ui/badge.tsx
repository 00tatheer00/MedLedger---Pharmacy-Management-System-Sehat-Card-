import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-500/10 text-slate-700 border-slate-300/50 backdrop-blur-md shadow-2xs',
  success:
    'bg-emerald-500/12 text-emerald-700 text-success border-emerald-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.15)]',
  warning:
    'bg-amber-500/12 text-amber-800 border-amber-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)]',
  danger:
    'bg-rose-500/12 text-rose-700 border-rose-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(244,63,94,0.15)]',
  info: 'bg-sky-500/12 text-sky-700 border-sky-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(14,165,233,0.15)]',
  muted: 'bg-slate-400/10 text-slate-500 border-slate-300/30 backdrop-blur-md',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function Badge({ variant = 'default', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
