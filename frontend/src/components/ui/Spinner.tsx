import { clsx } from 'clsx';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={clsx('inline-flex items-center gap-2', className)} role="status">
      <svg
        className={clsx('animate-spin text-brand-600', sizes[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
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
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="sr-only">Loading{label ? `: ${label}` : '...'}</span>
    </div>
  );
}

export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
