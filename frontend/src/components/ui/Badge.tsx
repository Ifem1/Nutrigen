import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' | 'secondary';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variants = {
  default: 'bg-brand-100 text-brand-700 border-brand-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-orange-100 text-orange-700 border-orange-200',
  destructive: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  outline: 'bg-transparent border-border text-foreground',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
};

const dotColors = {
  default: 'bg-brand-500',
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  destructive: 'bg-red-500',
  info: 'bg-blue-500',
  outline: 'bg-foreground',
  secondary: 'bg-muted-foreground',
};

const sizes = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
};

export function Badge({ variant = 'default', size = 'md', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border font-medium',
          variants[variant],
          sizes[size],
          className
        )
      )}
      {...props}
    >
      {dot && (
        <span className={clsx('h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

// Risk level specific badge
export function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const map: Record<string, BadgeProps['variant']> = {
    low: 'success',
    medium: 'warning',
    high: 'destructive',
    critical: 'destructive',
  };

  return (
    <Badge variant={map[level]} dot>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

// Verdict specific badge
export function VerdictBadge({ verdict }: { verdict: 'ACCEPTED' | 'REJECTED' | 'UNDETERMINED' | string }) {
  const map: Record<string, BadgeProps['variant']> = {
    ACCEPTED: 'success',
    REJECTED: 'destructive',
    UNDETERMINED: 'warning',
  };

  return (
    <Badge variant={map[verdict] ?? 'secondary'} dot>
      {verdict}
    </Badge>
  );
}

// Optimization status badge
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    pending: 'secondary',
    proposing: 'info',
    committing: 'info',
    revealing: 'info',
    accepted: 'success',
    rejected: 'destructive',
    undetermined: 'warning',
    escalated: 'warning',
    finalized: 'default',
    evaluated: 'info',
  };

  return (
    <Badge variant={map[status] ?? 'secondary'} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
