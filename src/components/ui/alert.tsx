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
    container: 'border-danger/30 bg-danger-light/50 text-danger',
    icon: AlertCircle,
    iconColor: 'text-danger',
    titleColor: 'text-red-900',
  },
  warning: {
    container: 'border-warning/30 bg-warning-light/50 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-950',
  },
  info: {
    container: 'border-info/30 bg-info-light/50 text-blue-900',
    icon: Info,
    iconColor: 'text-info',
    titleColor: 'text-blue-950',
  },
  success: {
    container: 'border-success/30 bg-success-light/50 text-emerald-900',
    icon: CheckCircle2,
    iconColor: 'text-success',
    titleColor: 'text-emerald-950',
  },
};

export function Alert({ variant = 'info', title, description, action, className }: AlertProps) {
  const config = variantStyles[variant];
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3.5 transition-all',
        config.container,
        className,
      )}
    >
      <IconComponent
        className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <h4 className={cn('text-sm font-semibold tracking-tight', config.titleColor)}>{title}</h4>
        {description && (
          <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 self-center pl-2">{action}</div>}
    </div>
  );
}
