import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white font-semibold shadow-sm hover:bg-primary-hover hover:shadow-md active:bg-primary-dark active:shadow-sm',
  secondary:
    'bg-navy text-white font-semibold shadow-sm hover:bg-navy-light hover:shadow-md active:bg-navy-dark active:shadow-sm',
  outline:
    'border border-border bg-white text-text-primary font-medium hover:bg-slate-50 hover:border-slate-400 hover:text-text-primary active:bg-slate-100',
  ghost: 'text-text-secondary hover:bg-slate-100 hover:text-text-primary active:bg-slate-200',
  destructive:
    'bg-danger text-white font-semibold shadow-sm hover:bg-red-600 hover:shadow-md active:bg-red-700 active:shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-10 px-5 text-sm gap-2 rounded-lg',
  xl: 'h-11 px-6 text-base gap-2.5 rounded-lg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-out',
          'focus-ring cursor-pointer',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

export { Button };
