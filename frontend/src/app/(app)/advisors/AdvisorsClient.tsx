'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, UserCheck } from 'lucide-react';
import { Card, CardContent, Spinner, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { FeedAdvisor } from '@/lib/genlayer/types';

const statusColor = (s: string) =>
  s === 'ACTIVE' ? 'success' : s === 'SUSPENDED' ? 'warning' : 'default';

export function AdvisorsClient() {
  const [advisors, setAdvisors] = useState<FeedAdvisor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from('feed_advisors')
      .select('raw_json')
      .order('registered_at', { ascending: false })
      .then(({ data }) => {
        setAdvisors((data ?? []).map((r: any) => r.raw_json as FeedAdvisor));
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Feed Advisors</h2>
          <p className="text-sm text-muted-foreground">Nutritionists and vets authorised to submit feed optimization requests.</p>
        </div>
        <Link href="/advisors/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Register Advisor</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : !advisors.length ? (
        <Card padding="md"><CardContent>
          <div className="flex flex-col items-center py-16 text-center">
            <UserCheck className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No advisors yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Register a feed advisor to authorise optimization requests.
            </p>
            <Link href="/advisors/new" className="mt-4">
              <Button size="sm">Register advisor</Button>
            </Link>
          </div>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {advisors.map((adv) => (
            <Card key={adv.advisor_id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                    <UserCheck className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{adv.name}</p>
                    <p className="truncate text-xs text-muted-foreground font-mono">{adv.advisor_id}</p>
                  </div>
                </div>
                <Badge variant={statusColor(adv.status) as any}>{adv.status}</Badge>
              </div>
              {adv.credential_summary && (
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{adv.credential_summary}</p>
              )}
              {adv.scope_summary && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium">Scope:</span> {adv.scope_summary}
                </p>
              )}
              <p className="mt-2 truncate font-mono text-xs text-muted-foreground/60">{adv.wallet}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
