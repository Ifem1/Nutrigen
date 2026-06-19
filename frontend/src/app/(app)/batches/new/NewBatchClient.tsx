'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { registerLivestockBatch, waitForTransaction } from '@/lib/genlayer/client';
import { buildMetadataHash } from '@/lib/nutrigen/feedPacket';
import { createClient } from '@/lib/supabase/client';
import { LIVESTOCK_TYPES, GROWTH_STAGES } from '@/config/constants';

export function NewBatchClient() {
  const router = useRouter();
  const { walletAddress } = useAuthStore();

  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    farm_id: '', species: '', breed_summary: '', production_stage: '',
    production_goal: '', head_count: '', weight_summary: '',
    health_status_summary: '', feeding_constraints: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    createClient()
      .from('farms').select('id, name').eq('status', 'ACTIVE')
      .then(({ data }) => setFarms(data ?? []));
  }, []);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const privateKey = sessionStorage.getItem('nutrigen_pk') ?? '';
    if (!privateKey || !walletAddress) { setError('Wallet not connected.'); return; }
    setSubmitting(true); setError('');
    try {
      const now = new Date().toISOString();
      const metadata_hash = await buildMetadataHash({ ...form, created_at: now });
      const txHash = await registerLivestockBatch({ batch_id: '', ...form, metadata_hash, registered_at: now }, privateKey);
      const receipt = await waitForTransaction(txHash);
      if (receipt.status !== 'ACCEPTED') throw new Error('Transaction not accepted');

      const batchId = (receipt.data as any)?.result ?? txHash;
      await createClient().from('livestock_batches').upsert({
        id: batchId, farm_id: form.farm_id, species: form.species,
        breed_summary: form.breed_summary, production_stage: form.production_stage,
        production_goal: form.production_goal, head_count: form.head_count,
        weight_summary: form.weight_summary,
        health_status_summary: form.health_status_summary,
        feeding_constraints: form.feeding_constraints,
        metadata_hash, status: 'ACTIVE',
        registered_by: walletAddress, registered_at: now,
        raw_json: { batch_id: batchId, ...form, metadata_hash, status: 'ACTIVE', registered_by: walletAddress, registered_at: now },
      });

      router.push('/batches');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to register batch.');
    } finally {
      setSubmitting(false);
    }
  }

  const F = ({ label, name, placeholder, required = false, textarea = false }: any) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}{required && ' *'}</label>
      {textarea ? (
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3} placeholder={placeholder} value={(form as any)[name]}
          onChange={(e) => set(name, e.target.value)} required={required}
        />
      ) : (
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder={placeholder} value={(form as any)[name]}
          onChange={(e) => set(name, e.target.value)} required={required}
        />
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Register Livestock Batch</h2>
        <p className="text-sm text-muted-foreground">Add a livestock group for feed optimization.</p>
      </div>
      <Card padding="md">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Farm *</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.farm_id} onChange={(e) => set('farm_id', e.target.value)} required
              >
                <option value="">Select farm…</option>
                {farms.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.id})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Species *</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.species} onChange={(e) => set('species', e.target.value)} required
              >
                <option value="">Select species…</option>
                {LIVESTOCK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <F label="Breed summary" name="breed_summary" placeholder="e.g. Friesian x Zebu crossbred" />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Production stage *</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.production_stage} onChange={(e) => set('production_stage', e.target.value)} required
              >
                <option value="">Select stage…</option>
                {GROWTH_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <F label="Production goal *" name="production_goal" placeholder="e.g. Maximize daily weight gain to 1.2kg/day for beef" required textarea />
            <F label="Head count" name="head_count" placeholder="e.g. 120 animals, avg 320kg" />
            <F label="Weight summary" name="weight_summary" placeholder="e.g. Range 280–380kg, target slaughter 450kg" />
            <F label="Health status summary" name="health_status_summary" placeholder="e.g. Vaccinated, no current illness, minor bloat risk noted" textarea />
            <F label="Feeding constraints" name="feeding_constraints" placeholder="e.g. No cottonseed cake — aflatoxin sensitivity confirmed. Max 1.5% urea." textarea />

            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" loading={submitting}>Register Batch</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
