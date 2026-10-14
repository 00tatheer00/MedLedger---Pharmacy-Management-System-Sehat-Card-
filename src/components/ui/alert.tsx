import { type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'critical' | 'warning' | 'info' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  {
    container: string;
    icon: typeof AlertCircle;
    iconColor: string;
    titleColor: string;
  }
> = {
  critical: {
    container: 'border-danger/30 bg-red-50 text-red-700',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    titleColor: 'text-red-900',
  },
  warning: {
    container: 'border-amber-300 bg-amber-50 text-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-900',
  },
  info: {
    container: 'border-sky-300 bg-sky-50 text-sky-800',
    icon: Info,
    iconColor: 'text-sky-500',
    titleColor: 'text-sky-900',
  },
  success: {
    container: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-900',
  },
};

export function Alert({ variant = 'info', title, description, action, className }: AlertProps) {
  const config = variantStyles[variant];
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-4 rounded-xl border-2 p-4 sm:p-5 transition-all',
        config.container,
        className,
      )}
    >
      <IconComponent
        className={cn('h-6 w-6 shrink-0 mt-0.5', config.iconColor)}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <h4 className={cn('text-base font-bold tracking-tight', config.titleColor)}>{title}</h4>
        {description && (
          <p className="mt-1 text-sm text-text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 self-center pl-2">{action}</div>}
    </div>
  );
}
