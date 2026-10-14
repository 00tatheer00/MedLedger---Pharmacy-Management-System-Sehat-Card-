import { type ElementType, type ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-page-bg/40 p-8 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hover-bg text-text-muted mb-3">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h4 className="text-base font-semibold text-text-primary">{title}</h4>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-text-secondary leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
