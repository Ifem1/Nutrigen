'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { Card, CardContent, Spinner, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { FeedStandardVersion } from '@/lib/genlayer/types';

const severityColor = (s: string) =>
  s === 'LOW' ? 'success' : s === 'MEDIUM' ? 'warning' : s === 'HIGH' ? 'destructive' : 'default';

export function FeedStandardsClient() {
  const [standards, setStandards] = useState<FeedStandardVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from('feed_standard_versions').select('raw_json').order('published_at', { ascending: false })
      .then(({ data }) => {
        setStandards((data ?? []).map((r: any) => r.raw_json as FeedStandardVersion));
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Feed Standards</h2>
          <p className="text-sm text-muted-foreground">Versioned livestock nutritional standards used by the optimizer.</p>
        </div>
        <Link href="/feed-standards/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Publish Standard</Button>
        </Link>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div>
        : !standards.length ? (
          <Card padding="md"><CardContent>
            <div className="flex flex-col items-center py-16 text-center">
              <BookOpen className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No feed standards yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Publish a standard to guide the AI optimizer.</p>
              <Link href="/feed-standards/new" className="mt-4"><Button size="sm">Publish standard</Button></Link>
            </div>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {standards.map((std) => (
              <Link key={`${std.farm_id}::${std.standard_id}::${std.version}`}
                href={`/feed-standards/${std.standard_id}?farm=${std.farm_id}&v=${std.version}`}>
                <Card padding="md" className="cursor-pointer transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{std.title}</p>
                      <p className="text-xs text-muted-foreground">v{std.version} · {std.standard_id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={std.status === 'ACTIVE' ? 'success' : 'warning'}>{std.status}</Badge>
                      <Badge variant={severityColor(std.severity) as any}>{std.severity}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-medium">Species:</span> {std.species_scope}</p>
                    <p><span className="font-medium">Stage:</span> {std.production_stage_scope}</p>
                  </div>
                  {(std as any).is_current && (
                    <p className="mt-2 rounded bg-brand-50 px-2 py-0.5 text-center text-xs font-medium text-brand-700">Current version</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
