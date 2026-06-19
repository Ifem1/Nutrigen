'use client';

import { useState } from 'react';
import { Button, Input, Select, Card, CardHeader, CardTitle } from '@/components/ui';
import { useOptimizerStore } from '@/store/optimizerStore';
import { LIVESTOCK_TYPES, GROWTH_STAGES } from '@/config/constants';

export function StepLivestock() {
  const { formData, updateForm, nextStep } = useOptimizerStore();
  const [form, setForm] = useState({
    livestock_type: formData.livestock_type ?? '',
    breed: formData.breed ?? '',
    herd_size: formData.herd_size?.toString() ?? '',
    avg_weight_kg: formData.avg_weight_kg?.toString() ?? '',
    target_weight_kg: formData.target_weight_kg?.toString() ?? '',
    growth_stage: formData.growth_stage ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.livestock_type) e.livestock_type = 'Required';
    if (!form.breed.trim()) e.breed = 'Required';
    if (!form.herd_size || Number(form.herd_size) < 1) e.herd_size = 'Must be ≥ 1';
    if (!form.avg_weight_kg || Number(form.avg_weight_kg) <= 0) e.avg_weight_kg = 'Required';
    if (!form.target_weight_kg || Number(form.target_weight_kg) <= 0) e.target_weight_kg = 'Required';
    if (!form.growth_stage) e.growth_stage = 'Required';
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateForm({
      livestock_type: form.livestock_type as any,
      breed: form.breed,
      herd_size: Number(form.herd_size),
      avg_weight_kg: Number(form.avg_weight_kg),
      target_weight_kg: Number(form.target_weight_kg),
      growth_stage: form.growth_stage,
    });
    nextStep();
  }

  return (
    <Card padding="md" className="space-y-4">
      <CardHeader><CardTitle>Livestock & Herd Details</CardTitle></CardHeader>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Livestock Type" required options={LIVESTOCK_TYPES.map((t) => ({ value: t.value, label: t.label }))} placeholder="Select type" value={form.livestock_type} onChange={(e) => setForm({ ...form, livestock_type: e.target.value })} error={errors.livestock_type} wrapperClassName="col-span-2" />
        <Input label="Breed" required value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} error={errors.breed} placeholder="e.g. Ross 308, Angus, Duroc" wrapperClassName="col-span-2" />
        <Input label="Herd Size (animals)" type="number" min="1" required value={form.herd_size} onChange={(e) => setForm({ ...form, herd_size: e.target.value })} error={errors.herd_size} placeholder="500" />
        <Select label="Growth Stage" required options={GROWTH_STAGES.map((s) => ({ value: s.value, label: s.label }))} placeholder="Select stage" value={form.growth_stage} onChange={(e) => setForm({ ...form, growth_stage: e.target.value })} error={errors.growth_stage} />
        <Input label="Avg Current Weight (kg)" type="number" step="0.1" required value={form.avg_weight_kg} onChange={(e) => setForm({ ...form, avg_weight_kg: e.target.value })} error={errors.avg_weight_kg} placeholder="1.2" />
        <Input label="Target Weight (kg)" type="number" step="0.1" required value={form.target_weight_kg} onChange={(e) => setForm({ ...form, target_weight_kg: e.target.value })} error={errors.target_weight_kg} placeholder="2.5" />
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={handleNext}>Next: Environment</Button>
      </div>
    </Card>
  );
}
