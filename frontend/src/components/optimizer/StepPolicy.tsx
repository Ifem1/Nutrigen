'use client';

import { Button, Card, CardHeader, CardTitle, Badge, Spinner } from '@/components/ui';
import { useOptimizerStore } from '@/store/optimizerStore';
import { usePolicies } from '@/hooks/usePolicies';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export function StepPolicy() {
  const { formData, updateForm, nextStep, prevStep } = useOptimizerStore();
  const { data: policies, isLoading } = usePolicies(formData.livestock_type);
  const selectedId = formData.policy_id;

  function handleNext() {
    if (!selectedId) return;
    nextStep();
  }

  return (
    <Card padding="md" className="space-y-4">
      <CardHeader>
        <CardTitle>Select Compliance Policy</CardTitle>
        <p className="text-sm text-muted-foreground">
          The selected policy rules will be evaluated against the AI-generated formula during consensus.
          Showing policies for {formData.livestock_type?.replace('_', ' ')}.
        </p>
      </CardHeader>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !policies?.length ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No active policies for this livestock type.</p>
          <a href="/policies/new" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
            Create a policy first
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {policies.filter((p: any) => p.status === 'active').map((p: any) => (
            <button
              key={p.id} type="button"
              onClick={() => updateForm({ policy_id: p.id })}
              className={clsx(
                'w-full rounded-lg border p-4 text-left transition-all',
                selectedId === p.id
                  ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                  : 'border-border hover:border-brand-300'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">v{p.version} · {p.policy_rules?.[0]?.count ?? 0} rules</p>
                </div>
                {selectedId === p.id && <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0" />}
              </div>
              {p.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep}>Back</Button>
        <Button onClick={handleNext} disabled={!selectedId}>Next: Review</Button>
      </div>
    </Card>
  );
}
