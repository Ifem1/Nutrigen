'use client';

import { useState } from 'react';
import { Button, Input, Select, Card, CardHeader, CardTitle } from '@/components/ui';
import { useOptimizerStore } from '@/store/optimizerStore';
import { SEASONS, COMMON_FEED_INGREDIENTS } from '@/config/constants';

export function StepEnvironment() {
  const { formData, updateForm, nextStep, prevStep } = useOptimizerStore();
  const [form, setForm] = useState({
    location_country: formData.location_country ?? '',
    location_region: formData.location_region ?? '',
    temperature_celsius: formData.temperature_celsius?.toString() ?? '',
    humidity_percent: formData.humidity_percent?.toString() ?? '',
    season: formData.season ?? '',
    weather_conditions: formData.weather_conditions ?? '',
    forage_quality_score: formData.forage_quality_score?.toString() ?? '6',
  });
  const [selectedForages, setSelectedForages] = useState<string[]>(formData.available_forages ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleForage(f: string) {
    setSelectedForages((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.location_country.trim()) e.location_country = 'Required';
    if (!form.season) e.season = 'Required';
    if (!form.temperature_celsius) e.temperature_celsius = 'Required';
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    updateForm({
      location_country: form.location_country,
      location_region: form.location_region,
      temperature_celsius: Number(form.temperature_celsius),
      humidity_percent: Number(form.humidity_percent || 60),
      season: form.season,
      weather_conditions: form.weather_conditions,
      forage_quality_score: Number(form.forage_quality_score),
      available_forages: selectedForages,
    });
    nextStep();
  }

  const FORAGE_ITEMS = ['Fresh Grass', 'Hay', 'Silage', 'Corn Silage', 'Straw', 'Alfalfa'];

  return (
    <Card padding="md" className="space-y-4">
      <CardHeader><CardTitle>Environmental Context</CardTitle></CardHeader>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Country" required value={form.location_country} onChange={(e) => setForm({ ...form, location_country: e.target.value })} error={errors.location_country} placeholder="Nigeria" />
        <Input label="Region / State" value={form.location_region} onChange={(e) => setForm({ ...form, location_region: e.target.value })} placeholder="Lagos" />
        <Input label="Temperature (°C)" type="number" required value={form.temperature_celsius} onChange={(e) => setForm({ ...form, temperature_celsius: e.target.value })} error={errors.temperature_celsius} placeholder="32" />
        <Input label="Humidity (%)" type="number" min="0" max="100" value={form.humidity_percent} onChange={(e) => setForm({ ...form, humidity_percent: e.target.value })} placeholder="75" />
        <Select label="Season" required options={SEASONS.map((s) => ({ value: s.value, label: s.label }))} placeholder="Select season" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} error={errors.season} wrapperClassName="col-span-2" />
        <Input label="Weather Notes" value={form.weather_conditions} onChange={(e) => setForm({ ...form, weather_conditions: e.target.value })} placeholder="e.g. Heavy rains, drought conditions" wrapperClassName="col-span-2" />
        <Input label="Forage Quality (0-10)" type="number" min="0" max="10" step="0.5" value={form.forage_quality_score} onChange={(e) => setForm({ ...form, forage_quality_score: e.target.value })} wrapperClassName="col-span-2" />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Available Forages</p>
        <div className="flex flex-wrap gap-2">
          {FORAGE_ITEMS.map((f) => (
            <button
              key={f} type="button"
              onClick={() => toggleForage(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${selectedForages.includes(f) ? 'bg-brand-600 text-white border-brand-600' : 'border-border text-muted-foreground hover:border-brand-400'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep}>Back</Button>
        <Button onClick={handleNext}>Next: Budget</Button>
      </div>
    </Card>
  );
}
