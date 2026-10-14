import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-text-primary',
          'placeholder:text-text-muted focus-ring transition-all duration-150',
          'hover:border-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/20',
          'disabled:cursor-not-allowed disabled:bg-hover-bg disabled:opacity-60',
          error && 'border-danger focus-visible:outline-danger',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
