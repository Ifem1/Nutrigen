'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Package } from 'lucide-react';
import { Card, CardContent, Spinner, Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { FeedIngredient } from '@/lib/genlayer/types';

export function IngredientsClient() {
  const [items, setItems] = useState<FeedIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from('feed_ingredients').select('raw_json').order('registered_at', { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []).map((r: any) => r.raw_json as FeedIngredient));
        setLoading(false);
      });
  }, []);

  const statusColor = (s: string) =>
    s === 'ACTIVE' ? 'success' : s === 'UNAVAILABLE' ? 'warning' : 'default';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Feed Ingredients</h2>
          <p className="text-sm text-muted-foreground">Manage ingredients available for ration optimization.</p>
        </div>
        <Link href="/ingredients/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Ingredient</Button>
        </Link>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div>
        : !items.length ? (
          <Card padding="md"><CardContent>
            <div className="flex flex-col items-center py-16 text-center">
              <Package className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No ingredients yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Register feed ingredients your farm uses.</p>
              <Link href="/ingredients/new" className="mt-4"><Button size="sm">Add ingredient</Button></Link>
            </div>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((ing) => (
              <Link key={ing.ingredient_id} href={`/ingredients/${ing.ingredient_id}`}>
                <Card padding="md" className="cursor-pointer transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{ing.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{ing.category}</p>
                    </div>
                    <Badge variant={statusColor(ing.status) as any}>{ing.status}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{ing.nutrient_profile_summary}</p>
                  {ing.cost_summary && (
                    <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Cost:</span> {ing.cost_summary}</p>
                  )}
                  <p className="mt-2 font-mono text-xs text-muted-foreground/60">{ing.ingredient_id}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
