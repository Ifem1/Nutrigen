'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { Card, CardContent, Spinner } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import type { OptimizationRequest } from '@/lib/genlayer/types';

const STATUS_COLOR: Record<string, string> = {
  APPROVED: 'text-green-700 bg-green-50 border-green-200',
  HUMAN_APPROVED: 'text-green-700 bg-green-50 border-green-200',
  ACTIVATED: 'text-green-800 bg-green-100 border-green-300',
  REJECTED: 'text-red-700 bg-red-50 border-red-200',
  HUMAN_REJECTED: 'text-red-700 bg-red-50 border-red-200',
  BLOCKED: 'text-red-700 bg-red-50 border-red-200',
  NEEDS_REVIEW: 'text-orange-700 bg-orange-50 border-orange-200',
  NEEDS_REVISION: 'text-orange-700 bg-orange-50 border-orange-200',
  PENDING: 'text-blue-700 bg-blue-50 border-blue-200',
};

export default function HistoryPage() {
  const [requests, setRequests] = useState<OptimizationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from('optimization_requests')
      .select('raw_json')
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        setRequests((data ?? []).map((r: any) => r.raw_json as OptimizationRequest));
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Optimization History</h2>
          <p className="text-sm text-muted-foreground">All feed optimization requests across your farms.</p>
        </div>
        <Link href="/optimizer">
          <Button leftIcon={<FlaskConical className="h-4 w-4" />}>New Optimization</Button>
        </Link>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div>
        : !requests.length ? (
          <Card padding="md"><CardContent>
            <div className="flex flex-col items-center py-16 text-center">
              <FlaskConical className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No optimization requests yet</p>
              <Link href="/optimizer" className="mt-4"><Button size="sm">Run your first optimization</Button></Link>
            </div>
          </CardContent></Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-border">
              {requests.map((req) => (
                <li key={req.request_id}>
                  <Link href={`/results/${req.request_id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                        <FlaskConical className="h-4 w-4 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-foreground">{req.request_id}</p>
                        <p className="text-xs text-muted-foreground">Farm: {req.farm_id} · Batch: {req.batch_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.submitted_at
                            ? formatDistanceToNow(new Date(req.submitted_at), { addSuffix: true })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${STATUS_COLOR[req.status] ?? 'bg-secondary text-muted-foreground'}`}>
                      {req.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
    </div>
  );
}
