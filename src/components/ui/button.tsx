import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-dark shadow-md hover:shadow-lg font-bold',
  secondary: 'bg-navy text-white hover:bg-navy-light active:bg-navy-dark shadow-md hover:shadow-lg',
  outline:
    'border-2 border-border bg-card-bg text-text-primary hover:bg-hover-bg hover:border-primary active:bg-border-light font-semibold',
  ghost: 'text-text-secondary hover:bg-hover-bg hover:text-text-primary active:bg-border-light',
  destructive:
    'bg-danger text-white hover:bg-red-600 active:bg-red-700 shadow-md hover:shadow-lg font-bold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-2 rounded-lg',
  md: 'h-11 px-5 text-base gap-2.5 rounded-xl',
  lg: 'h-12 px-6 text-lg gap-3 rounded-xl',
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
