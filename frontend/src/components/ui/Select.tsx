import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 pr-8 py-1 text-sm shadow-sm',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-destructive focus-visible:ring-destructive',
                className
              )
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
