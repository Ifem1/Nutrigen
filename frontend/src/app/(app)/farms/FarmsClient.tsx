'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Tractor } from 'lucide-react';
import { Card, CardContent, Spinner, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Farm } from '@/lib/genlayer/types';

export function FarmsClient() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('farms')
        .select('raw_json')
        .order('created_at', { ascending: false });
      setFarms((data ?? []).map((r: any) => r.raw_json as Farm));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Farms</h2>
          <p className="text-sm text-muted-foreground">Manage your livestock farms on-chain.</p>
        </div>
        <Link href="/farms/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Farm</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : !farms.length ? (
        <Card padding="md">
          <CardContent>
            <div className="flex flex-col items-center py-16 text-center">
              <Tractor className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No farms yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Create your first farm to start optimizing livestock feed.</p>
              <Link href="/farms/new" className="mt-4">
                <Button size="sm">Create farm</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Link key={farm.farm_id} href={`/farms/${farm.farm_id}`}>
              <Card padding="md" className="cursor-pointer transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                      <Tractor className="h-5 w-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{farm.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{farm.farm_type}</p>
                    </div>
                  </div>
                  <Badge variant={farm.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {farm.status}
                  </Badge>
                </div>
                {farm.location_context && (
                  <p className="mt-3 truncate text-xs text-muted-foreground">{farm.location_context}</p>
                )}
                <p className="mt-2 font-mono text-xs text-muted-foreground/60">{farm.farm_id}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
