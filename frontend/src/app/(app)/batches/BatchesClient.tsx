'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Beef } from 'lucide-react';
import { Card, CardContent, Spinner, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { LivestockBatch } from '@/lib/genlayer/types';

export function BatchesClient() {
  const [batches, setBatches] = useState<LivestockBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('livestock_batches')
        .select('raw_json')
        .order('registered_at', { ascending: false });
      setBatches((data ?? []).map((r: any) => r.raw_json as LivestockBatch));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Livestock Batches</h2>
          <p className="text-sm text-muted-foreground">Track livestock groups for feed optimization.</p>
        </div>
        <Link href="/batches/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Batch</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : !batches.length ? (
        <Card padding="md">
          <CardContent>
            <div className="flex flex-col items-center py-16 text-center">
              <Beef className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No batches yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Register a livestock batch to run feed optimization.</p>
              <Link href="/batches/new" className="mt-4">
                <Button size="sm">Register batch</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Link key={batch.batch_id} href={`/batches/${batch.batch_id}`}>
              <Card padding="md" className="cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                      <Beef className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground capitalize">{batch.species}</p>
                      <p className="truncate text-xs text-muted-foreground">{batch.production_stage}</p>
                    </div>
                  </div>
                  <Badge variant={batch.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {batch.status}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Head count:</span> {batch.head_count}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    <span className="font-medium">Goal:</span> {batch.production_goal}
                  </p>
                </div>
                <p className="mt-2 font-mono text-xs text-muted-foreground/60">{batch.batch_id}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
