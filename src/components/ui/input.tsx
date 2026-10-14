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
          'flex h-10 w-full rounded-xl border border-white/80 bg-white/70 backdrop-blur-md px-3.5 py-2 text-sm text-text-primary',
          'placeholder:text-text-muted focus-ring transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]',
          'hover:border-teal-500/40 hover:bg-white/90',
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
