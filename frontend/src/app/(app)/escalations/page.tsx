'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, Spinner } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Escalation } from '@/lib/genlayer/types';

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from('escalations')
      .select('raw_json')
      .order('opened_at', { ascending: false })
      .then(({ data }) => {
        setEscalations((data ?? []).map((r: any) => r.raw_json as Escalation));
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Escalations</h2>
        <p className="text-sm text-muted-foreground">Feed optimization requests requiring human nutritionist or vet review.</p>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div>
        : !escalations.length ? (
          <Card padding="md"><CardContent>
            <div className="flex flex-col items-center py-16 text-center">
              <AlertTriangle className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No escalations</p>
              <p className="mt-1 text-xs text-muted-foreground">Feed plans requiring human review will appear here.</p>
            </div>
          </CardContent></Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-border">
              {escalations.map((esc) => (
                <li key={esc.escalation_id}>
                  <Link href={`/escalations/${esc.request_id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className={`h-5 w-5 ${esc.status === 'OPEN' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-mono text-sm font-semibold text-foreground">{esc.request_id}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{esc.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {esc.opened_at
                            ? formatDistanceToNow(new Date(esc.opened_at), { addSuffix: true })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                      esc.status === 'OPEN'
                        ? 'border-orange-200 bg-orange-50 text-orange-700'
                        : 'border-green-200 bg-green-50 text-green-700'
                    }`}>{esc.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
    </div>
  );
}
