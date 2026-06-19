import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={twMerge(
            clsx(
              'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
