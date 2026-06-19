import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const variants = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline:
    'border border-border bg-transparent hover:bg-secondary text-foreground',
  ghost:
    'bg-transparent hover:bg-secondary text-foreground',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link:
    'text-brand-600 underline-offset-4 hover:underline p-0 h-auto',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(clsx(base, variants[variant], sizes[size], className))}
        {...props}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
