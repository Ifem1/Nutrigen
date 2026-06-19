import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown } from 'lucide-react';

// ── Primitives ─────────────────────────────────────────────

export function Table({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={twMerge('w-full caption-bottom text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={twMerge('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={twMerge('[&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={twMerge(
        'border-b border-border transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={twMerge(
        'h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={twMerge('px-4 py-3 align-middle text-sm text-foreground', className)}
      {...props}
    >
      {children}
    </td>
  );
}

// ── Sort header ────────────────────────────────────────────

interface SortableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
}

export function SortableHead({ sorted, onSort, children, className, ...props }: SortableHeadProps) {
  return (
    <TableHead
      className={twMerge('cursor-pointer select-none', className)}
      onClick={onSort}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sorted === 'asc' && <ChevronUp className="h-3 w-3 text-brand-600" />}
        {sorted === 'desc' && <ChevronDown className="h-3 w-3 text-brand-600" />}
        {!sorted && <span className="h-3 w-3" />}
      </div>
    </TableHead>
  );
}

// ── Empty state row ────────────────────────────────────────

export function TableEmpty({ colSpan, message = 'No data found.' }: { colSpan: number; message?: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}
