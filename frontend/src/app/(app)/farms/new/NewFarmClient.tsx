'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { createFarm } from '@/lib/genlayer/client';
import { buildMetadataHash } from '@/lib/nutrigen/feedPacket';
import { waitForTransaction } from '@/lib/genlayer/client';
import { createClient } from '@/lib/supabase/client';

export function NewFarmClient() {
  const router = useRouter();
  const { walletAddress } = useAuthStore();

  const [form, setForm] = useState({
    name: '', farm_type: '', location_context: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletAddress) { setError('Wallet not connected.'); return; }

    const privateKey = sessionStorage.getItem('nutrigen_pk') ?? '';
    if (!privateKey) { setError('Private key not found in session. Please re-login.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const metadata_hash = await buildMetadataHash({
        name: form.name, farm_type: form.farm_type,
        location_context: form.location_context, created_at: now,
      });

      const txHash = await createFarm({
        farm_id: '', name: form.name,
        farm_type: form.farm_type, location_context: form.location_context,
        metadata_hash, created_at: now,
      }, privateKey, walletAddress);

      const receipt = await waitForTransaction(txHash);
      if (receipt.status !== 'ACCEPTED') {
        throw new Error('Transaction not accepted: ' + receipt.status);
      }

      // Mirror to Supabase — the contract auto-generates the ID so we read it from receipt
      const farmId = (receipt.data as any)?.result ?? txHash;
      const supabase = createClient();
      await supabase.from('farms').upsert({
        id: farmId, name: form.name, farm_type: form.farm_type,
        location_context: form.location_context, metadata_hash,
        status: 'ACTIVE', created_by_wallet: walletAddress,
        created_at: now,
        raw_json: {
          farm_id: farmId, name: form.name, farm_type: form.farm_type,
          location_context: form.location_context, metadata_hash,
          status: 'ACTIVE', created_by: walletAddress, created_at: now,
          optimization_config: {
            min_approve_nutrient_adequacy: '78', min_approve_suitability: '78',
            min_approve_safety: '84', min_approve_availability: '65',
            min_approve_practicality: '65', max_approve_risk: '35',
            auto_review_risk: '60', auto_reject_risk: '88',
          },
        },
      });

      router.push('/farms');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create farm.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">New Farm</h2>
        <p className="text-sm text-muted-foreground">Register a farm on-chain for livestock feed optimization.</p>
      </div>

      <Card padding="md">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Farm name *</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Green Valley Ranch"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Farm type</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Cattle ranch, Poultry farm, Mixed livestock"
                value={form.farm_type}
                onChange={(e) => setForm((f) => ({ ...f, farm_type: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Location context</label>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={3}
                placeholder="e.g. Semi-arid region, Nigeria. Dry season Nov–Apr. Feed prices high June–Aug."
                value={form.location_context}
                onChange={(e) => setForm((f) => ({ ...f, location_context: e.target.value }))}
              />
            </div>

            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" loading={submitting}>Create Farm</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
