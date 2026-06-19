import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftAddon, rightAddon, wrapperClassName, className, id, ...props },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center text-muted-foreground">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-destructive focus-visible:ring-destructive',
                leftAddon && 'pl-9',
                rightAddon && 'pr-9',
                className
              )
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-muted-foreground">
              {rightAddon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
