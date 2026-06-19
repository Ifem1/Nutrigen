'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { AuditLog } from '@/lib/genlayer/types';

const PAGE_SIZE = 30;

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    createClient()
      .from('audit_events')
      .select('raw_json', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
      .then(({ data, count }) => {
        setLogs((data ?? []).map((r: any) => r.raw_json as AuditLog));
        setTotal(count ?? 0);
        setLoading(false);
      });
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const eventColor = (eventType: string) => {
    if (eventType.includes('APPROVED') || eventType.includes('ACTIVATED')) return 'bg-green-50 text-green-700';
    if (eventType.includes('REJECTED') || eventType.includes('BLOCKED')) return 'bg-red-50 text-red-700';
    if (eventType.includes('ESCALAT') || eventType.includes('REVIEW')) return 'bg-orange-50 text-orange-700';
    return 'bg-secondary text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Audit Trail</h2>
        <p className="text-sm text-muted-foreground">Immutable on-chain event log for all feed optimization activity.</p>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !logs.length ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No audit events recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.audit_id} className="flex items-start gap-4 px-5 py-3.5">
                <div className="mt-0.5 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${eventColor(log.event_type)}`}>
                    {log.event_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{log.summary}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    {log.actor && <span>by {log.actor}</span>}
                    {log.farm_id && <span>Farm: {log.farm_id}</span>}
                    {log.request_id && <span>Req: {log.request_id}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">
                    {log.created_at
                      ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
                      : '—'}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground/60">{log.audit_id}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{total} events</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded border border-border px-2.5 py-1 text-xs disabled:opacity-40">Prev</button>
              <span className="px-2 text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded border border-border px-2.5 py-1 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
