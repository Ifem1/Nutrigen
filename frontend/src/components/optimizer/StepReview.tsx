'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Card, CardHeader, CardTitle } from '@/components/ui';
import { useOptimizerStore } from '@/store/optimizerStore';
import { useOrgStore } from '@/store/orgStore';
import { useAuthStore } from '@/store/authStore';
import { LIVESTOCK_TYPES, GROWTH_STAGES, SEASONS, CURRENCIES } from '@/config/constants';

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value ?? '—'}</span>
    </div>
  );
}

export function StepReview() {
  const { formData, prevStep, setSubmittedRequestId, setSubmitting, isSubmitting } = useOptimizerStore();
  const { organization } = useOrgStore();
  const { user } = useAuthStore();

  const livestock = LIVESTOCK_TYPES.find((t) => t.value === formData.livestock_type)?.label;
  const stage = GROWTH_STAGES.find((s) => s.value === formData.growth_stage)?.label;
  const season = SEASONS.find((s) => s.value === formData.season)?.label;
  const currency = CURRENCIES.find((c) => c.value === formData.currency)?.symbol ?? '$';

  async function handleSubmit() {
    if (!organization || !user) { toast.error('Not authenticated.'); return; }
    setSubmitting(true);

    try {
      const res = await fetch('/api/optimizer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          org_id: organization.id,
          user_id: user.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Submission failed');

      setSubmittedRequestId(json.data.request_id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submission failed');
      setSubmitting(false);
    }
  }

  return (
    <Card padding="md" className="space-y-4">
      <CardHeader><CardTitle>Review & Submit</CardTitle></CardHeader>
      <p className="text-sm text-muted-foreground">
        Submitting will trigger AI feed formula generation followed by GenLayer consensus validation. This may take 1–3 minutes.
      </p>

      <Card variant="bordered" padding="sm" className="space-y-0">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Livestock</p>
        <Row label="Type" value={livestock} />
        <Row label="Breed" value={formData.breed} />
        <Row label="Herd Size" value={`${formData.herd_size} animals`} />
        <Row label="Growth Stage" value={stage} />
        <Row label="Current Weight" value={`${formData.avg_weight_kg} kg`} />
        <Row label="Target Weight" value={`${formData.target_weight_kg} kg`} />
      </Card>

      <Card variant="bordered" padding="sm" className="space-y-0">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Environment</p>
        <Row label="Location" value={[formData.location_region, formData.location_country].filter(Boolean).join(', ')} />
        <Row label="Season" value={season} />
        <Row label="Temperature" value={`${formData.temperature_celsius}°C`} />
        <Row label="Humidity" value={`${formData.humidity_percent}%`} />
      </Card>

      <Card variant="bordered" padding="sm" className="space-y-0">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Budget</p>
        <Row label="Daily budget/head" value={`${currency}${formData.budget_per_head_per_day}`} />
        <Row label="Max feed cost/kg" value={`${currency}${formData.max_feed_cost_per_kg}`} />
      </Card>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>Back</Button>
        <Button onClick={handleSubmit} loading={isSubmitting}>
          Submit for Consensus Validation
        </Button>
      </div>
    </Card>
  );
}
