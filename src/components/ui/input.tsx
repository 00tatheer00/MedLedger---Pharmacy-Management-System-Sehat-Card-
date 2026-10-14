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
          'flex h-9.5 w-full rounded-md border border-border bg-card-bg px-3 py-1.5 text-sm text-text-primary',
          'placeholder:text-text-muted focus-ring transition-colors',
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
