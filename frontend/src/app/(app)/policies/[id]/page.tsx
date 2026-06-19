'use client';

import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge, Spinner } from '@/components/ui';
import { usePolicy, useUpdatePolicyStatus } from '@/hooks/usePolicies';
import { LIVESTOCK_TYPES } from '@/config/constants';

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: policy, isLoading } = usePolicy(id);
  const updateStatus = useUpdatePolicyStatus();

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!policy) return <p className="text-center text-muted-foreground py-20">Policy not found.</p>;

  const livestock = LIVESTOCK_TYPES.find((t) => t.value === policy.livestock_type)?.label ?? policy.livestock_type;
  const rules = policy.policy_rules ?? [];
  const versions = policy.policy_versions ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/policies')}>
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{policy.name}</h2>
          <p className="text-sm text-muted-foreground">{livestock} · v{policy.version} · {formatDistanceToNow(new Date(policy.updated_at), { addSuffix: true })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={policy.status === 'active' ? 'success' : policy.status === 'draft' ? 'secondary' : 'outline'} dot>
            {policy.status}
          </Badge>
          {policy.status === 'draft' && (
            <Button size="sm" onClick={() => updateStatus.mutate({ id: policy.id, status: 'active' })} loading={updateStatus.isPending}>
              Activate
            </Button>
          )}
          {policy.status === 'active' && (
            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: policy.id, status: 'archived' })} loading={updateStatus.isPending}>
              Archive
            </Button>
          )}
        </div>
      </div>

      {policy.description && (
        <p className="text-sm text-muted-foreground">{policy.description}</p>
      )}

      {/* Rules */}
      <Card padding="none">
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle>Policy Rules ({rules.length})</CardTitle>
        </CardHeader>
        <div className="divide-y divide-border">
          {rules.length === 0 && <p className="px-5 py-6 text-sm text-muted-foreground">No rules defined.</p>}
          {rules.map((r: any) => (
            <div key={r.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.rule_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.rule_category} · <code className="font-mono">{r.parameter}</code></p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.is_mandatory ? (
                    <Badge variant="destructive" size="sm">Required</Badge>
                  ) : (
                    <Badge variant="secondary" size="sm">Optional</Badge>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                {r.min_value != null && <span>Min: <strong>{r.min_value}</strong> {r.unit}</span>}
                {r.max_value != null && <span>Max: <strong>{r.max_value}</strong> {r.unit}</span>}
                <span>Tolerance: {r.tolerance_percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Version history */}
      {versions.length > 0 && (
        <Card padding="none">
          <CardHeader className="border-b border-border px-5 py-4">
            <CardTitle>Version History</CardTitle>
          </CardHeader>
          <div className="divide-y divide-border">
            {versions.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">v{v.version}</p>
                  {v.change_summary && <p className="text-xs text-muted-foreground">{v.change_summary}</p>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
