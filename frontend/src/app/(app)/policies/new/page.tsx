'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Textarea, Select, Card, CardHeader, CardTitle } from '@/components/ui';
import { useCreatePolicy } from '@/hooks/usePolicies';
import { LIVESTOCK_TYPES, POLICY_RULE_CATEGORIES } from '@/config/constants';

const UNIT_OPTIONS = [
  { value: '%', label: '%' }, { value: 'kcal/kg', label: 'kcal/kg' },
  { value: 'USD/day', label: 'USD/day' }, { value: 'USD/kg', label: 'USD/kg' },
  { value: 'score', label: 'score (0-10)' }, { value: 'kg/day', label: 'kg/day' },
  { value: 'ratio', label: 'ratio' }, { value: 'L/day', label: 'L/day' },
];

type Rule = {
  rule_name: string; rule_category: string; parameter: string;
  min_value: string; max_value: string; unit: string;
  tolerance_percent: string; is_mandatory: boolean; description: string;
};

const emptyRule = (): Rule => ({
  rule_name: '', rule_category: 'nutritional', parameter: '', min_value: '',
  max_value: '', unit: '%', tolerance_percent: '5', is_mandatory: true, description: '',
});

export default function NewPolicyPage() {
  const router = useRouter();
  const create = useCreatePolicy();
  const [form, setForm] = useState({ name: '', description: '', livestock_type: '' });
  const [rules, setRules] = useState<Rule[]>([emptyRule()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateRule(i: number, field: keyof Rule, value: string | boolean) {
    setRules((rs) => rs.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.livestock_type) e.livestock_type = 'Select a livestock type.';
    rules.forEach((r, i) => {
      if (!r.rule_name.trim()) e[`rule_name_${i}`] = 'Required';
      if (!r.parameter.trim()) e[`rule_param_${i}`] = 'Required';
    });
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    await create.mutateAsync({
      name: form.name,
      description: form.description,
      livestock_type: form.livestock_type,
      rules: rules.map((r) => ({
        ...r,
        min_value: r.min_value ? Number(r.min_value) : undefined,
        max_value: r.max_value ? Number(r.max_value) : undefined,
        tolerance_percent: Number(r.tolerance_percent),
      })),
    });
    router.push('/policies');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-xl font-bold text-foreground">Create New Policy</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="md" className="space-y-4">
          <CardHeader><CardTitle>Policy Details</CardTitle></CardHeader>
          <Input label="Policy Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} placeholder="Broiler Grower Standard" />
          <Select label="Livestock Type" required options={LIVESTOCK_TYPES.map((t) => ({ value: t.value, label: t.label }))} placeholder="Select livestock type" value={form.livestock_type} onChange={(e) => setForm({ ...form, livestock_type: e.target.value })} error={errors.livestock_type} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." rows={2} />
        </Card>

        <Card padding="md">
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Policy Rules</CardTitle>
            <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setRules((rs) => [...rs, emptyRule()])}>
              Add Rule
            </Button>
          </div>
          <div className="space-y-6">
            {rules.map((rule, i) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Rule {i + 1}</span>
                  {rules.length > 1 && (
                    <Button type="button" variant="ghost" size="xs" onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Rule Name" required value={rule.rule_name} onChange={(e) => updateRule(i, 'rule_name', e.target.value)} error={errors[`rule_name_${i}`]} placeholder="Min Crude Protein" />
                  <Select label="Category" options={POLICY_RULE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} value={rule.rule_category} onChange={(e) => updateRule(i, 'rule_category', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Parameter" required value={rule.parameter} onChange={(e) => updateRule(i, 'parameter', e.target.value)} error={errors[`rule_param_${i}`]} placeholder="crude_protein" />
                  <Select label="Unit" options={UNIT_OPTIONS} value={rule.unit} onChange={(e) => updateRule(i, 'unit', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Min Value" type="number" step="any" value={rule.min_value} onChange={(e) => updateRule(i, 'min_value', e.target.value)} placeholder="e.g. 18" />
                  <Input label="Max Value" type="number" step="any" value={rule.max_value} onChange={(e) => updateRule(i, 'max_value', e.target.value)} placeholder="e.g. 23" />
                  <Input label="Tolerance %" type="number" step="any" value={rule.tolerance_percent} onChange={(e) => updateRule(i, 'tolerance_percent', e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`mandatory-${i}`} checked={rule.is_mandatory} onChange={(e) => updateRule(i, 'is_mandatory', e.target.checked)} className="accent-brand-600" />
                  <label htmlFor={`mandatory-${i}`} className="text-sm text-foreground">Mandatory rule</label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/policies')}>Cancel</Button>
          <Button type="submit" loading={create.isPending}>Create Policy</Button>
        </div>
      </form>
    </div>
  );
}
