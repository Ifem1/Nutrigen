'use client';

import Link from 'next/link';
import { Plus, ShieldCheck, Edit, Archive } from 'lucide-react';
import { Button, Card, Badge, Spinner, StatusBadge } from '@/components/ui';
import { usePolicies, useUpdatePolicyStatus } from '@/hooks/usePolicies';
import { LIVESTOCK_TYPES } from '@/config/constants';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export default function PoliciesPage() {
  const [filter, setFilter] = useState('');
  const { data: policies, isLoading } = usePolicies(filter || undefined);
  const updateStatus = useUpdatePolicyStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Policy Management</h2>
          <p className="text-sm text-muted-foreground">Define nutritional, cost, and welfare rules for each livestock type.</p>
        </div>
        <Link href="/policies/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Policy</Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!filter ? 'bg-brand-600 text-white border-brand-600' : 'border-border text-muted-foreground hover:border-brand-400'}`}
        >
          All
        </button>
        {LIVESTOCK_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filter === t.value ? 'bg-brand-600 text-white border-brand-600' : 'border-border text-muted-foreground hover:border-brand-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !policies?.length ? (
        <Card padding="lg" className="text-center py-16">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No policies yet. Create one to start validating feed formulas.</p>
          <Link href="/policies/new" className="mt-4 inline-block">
            <Button size="sm">Create first policy</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {policies.map((p: any) => {
            const livestock = LIVESTOCK_TYPES.find((t) => t.value === p.livestock_type)?.label ?? p.livestock_type;
            const rulesCount = p.policy_rules?.[0]?.count ?? 0;
            return (
              <Card key={p.id} padding="md" className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{livestock}</p>
                  </div>
                  <Badge variant={p.status === 'active' ? 'success' : p.status === 'draft' ? 'secondary' : 'outline'} dot>
                    {p.status}
                  </Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{rulesCount} rules</span>
                  <span>v{p.version}</span>
                  <span>{formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}</span>
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                  <Link href={`/policies/${p.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<Edit className="h-3.5 w-3.5" />}>
                      Edit
                    </Button>
                  </Link>
                  {p.status !== 'archived' && (
                    <Button
                      variant="ghost" size="sm"
                      leftIcon={<Archive className="h-3.5 w-3.5" />}
                      onClick={() => updateStatus.mutate({ id: p.id, status: 'archived' })}
                      loading={updateStatus.isPending}
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
