import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-border-light text-text-secondary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-amber-800',
  danger: 'bg-danger-light text-danger',
  info: 'bg-info-light text-info',
  muted: 'bg-page-bg text-text-muted',
};

export function Badge({ variant = 'default', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
