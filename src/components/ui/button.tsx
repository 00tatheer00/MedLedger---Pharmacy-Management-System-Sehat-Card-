import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-dark shadow-[0_4px_16px_rgba(13,148,136,0.3)] hover:shadow-[0_6px_24px_rgba(13,148,136,0.45)] font-bold border border-white/20 backdrop-blur-md ios-press',
  secondary:
    'bg-navy text-white hover:bg-navy-light active:bg-navy-dark shadow-[0_4px_16px_rgba(15,23,42,0.25)] hover:shadow-lg font-bold border border-white/10 ios-press',
  outline:
    'border border-white/80 bg-white/70 backdrop-blur-xl text-text-primary hover:bg-white hover:border-teal-500/40 active:bg-white/90 shadow-2xs font-semibold ios-press',
  ghost:
    'text-text-secondary hover:bg-white/60 hover:text-text-primary active:bg-white/80 backdrop-blur-sm ios-press',
  destructive:
    'bg-danger text-white hover:bg-red-600 active:bg-red-700 shadow-[0_4px_16px_rgba(239,68,68,0.3)] font-bold border border-white/20 ios-press',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-2 rounded-full',
  md: 'h-11 px-5 text-base gap-2.5 rounded-full',
  lg: 'h-12 px-6 text-lg gap-3 rounded-full',
  xl: 'h-14 px-8 text-xl gap-3 rounded-2xl',
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
          'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out',
          'focus-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.97]',
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
    'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

export { Button };
