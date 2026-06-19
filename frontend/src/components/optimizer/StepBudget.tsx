'use client';

import { useState } from 'react';
import { Button, Input, Select, Card, CardHeader, CardTitle } from '@/components/ui';
import { useOptimizerStore } from '@/store/optimizerStore';
import { CURRENCIES } from '@/config/constants';

export function StepBudget() {
  const { formData, updateForm, nextStep, prevStep } = useOptimizerStore();
  const [form, setForm] = useState({
    budget_per_head_per_day: formData.budget_per_head_per_day?.toString() ?? '',
    currency: formData.currency ?? 'USD',
    max_feed_cost_per_kg: formData.max_feed_cost_per_kg?.toString() ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.budget_per_head_per_day || Number(form.budget_per_head_per_day) <= 0) e.budget = 'Required';
    if (!form.max_feed_cost_per_kg || Number(form.max_feed_cost_per_kg) <= 0) e.max_cost = 'Required';
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateForm({
      budget_per_head_per_day: Number(form.budget_per_head_per_day),
      currency: form.currency,
      max_feed_cost_per_kg: Number(form.max_feed_cost_per_kg),
    });
    nextStep();
  }

  const currencySymbol = CURRENCIES.find((c) => c.value === form.currency)?.symbol ?? '$';

  return (
    <Card padding="md" className="space-y-4">
      <CardHeader><CardTitle>Budget & Cost Constraints</CardTitle></CardHeader>

      <Select label="Currency" options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
      <Input
        label={`Budget per head per day (${currencySymbol})`}
        type="number" step="0.01" required
        value={form.budget_per_head_per_day}
        onChange={(e) => setForm({ ...form, budget_per_head_per_day: e.target.value })}
        error={errors.budget}
        placeholder="0.12"
        hint="Maximum spend per animal per day on feed."
      />
      <Input
        label={`Max feed cost per kg (${currencySymbol})`}
        type="number" step="0.01" required
        value={form.max_feed_cost_per_kg}
        onChange={(e) => setForm({ ...form, max_feed_cost_per_kg: e.target.value })}
        error={errors.max_cost}
        placeholder="0.35"
        hint="Maximum acceptable cost per kg of finished feed mix."
      />

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep}>Back</Button>
        <Button onClick={handleNext}>Next: Policy</Button>
      </div>
    </Card>
  );
}
