'use client';

import { useState } from 'react';
import { Button, Input, Textarea, Card, CardHeader, CardTitle, Select } from '@/components/ui';
import { useOrgStore } from '@/store/orgStore';
import { useUpdateOrganization } from '@/hooks/useOrganization';
import { RISK_LEVELS } from '@/config/constants';

export default function OrgSettingsPage() {
  const { organization } = useOrgStore();
  const update = useUpdateOrganization();
  const [form, setForm] = useState({
    name: organization?.name ?? '',
    description: organization?.description ?? '',
    max_agents: organization?.max_agents?.toString() ?? '10',
    max_optimizations_per_day: organization?.max_optimizations_per_day?.toString() ?? '100',
    compliance_threshold: organization?.compliance_threshold?.toString() ?? '80',
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;
    await update.mutateAsync({
      id: organization.id,
      data: {
        name: form.name,
        description: form.description,
        max_agents: Number(form.max_agents),
        max_optimizations_per_day: Number(form.max_optimizations_per_day),
        compliance_threshold: Number(form.compliance_threshold),
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-foreground">Organization Settings</h2>

      <Card padding="md">
        <form onSubmit={handleSave} className="space-y-4">
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <Input label="Organization Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Max Agents" type="number" min="1" value={form.max_agents} onChange={(e) => setForm({ ...form, max_agents: e.target.value })} />
            <Input label="Max Optimizations/Day" type="number" min="1" value={form.max_optimizations_per_day} onChange={(e) => setForm({ ...form, max_optimizations_per_day: e.target.value })} />
            <Input label="Compliance Threshold (%)" type="number" min="0" max="100" value={form.compliance_threshold} onChange={(e) => setForm({ ...form, compliance_threshold: e.target.value })} hint="Minimum compliance score to auto-accept" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={update.isPending}>Save Settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
