'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { registerFeedIngredient, waitForTransaction } from '@/lib/genlayer/client';
import { buildMetadataHash } from '@/lib/nutrigen/feedPacket';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = [
  'Energy source', 'Protein source', 'Mineral supplement', 'Vitamin premix',
  'Fiber source', 'Fat/Oil source', 'Amino acid supplement', 'Feed additive', 'Forage', 'Other',
];

export function NewIngredientClient() {
  const router = useRouter();
  const { walletAddress } = useAuthStore();
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    farm_id: '', name: '', category: '',
    nutrient_profile_summary: '', safety_summary: '',
    availability_summary: '', cost_summary: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    createClient().from('farms').select('id, name').eq('status', 'ACTIVE')
      .then(({ data }) => setFarms(data ?? []));
  }, []);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const privateKey = sessionStorage.getItem('nutrigen_pk') ?? '';
    if (!privateKey || !walletAddress) { setError('Wallet not connected.'); return; }
    setSubmitting(true); setError('');
    try {
      const now = new Date().toISOString();
      const metadata_hash = await buildMetadataHash({ ...form, registered_at: now });
      const txHash = await registerFeedIngredient({ ingredient_id: '', ...form, metadata_hash, registered_at: now }, privateKey, walletAddress);
      const receipt = await waitForTransaction(txHash);
      if (receipt.status !== 'ACCEPTED') throw new Error('Transaction not accepted');

      const ingId = (receipt.data as any)?.result ?? txHash;
      await createClient().from('feed_ingredients').upsert({
        id: ingId, ...form, metadata_hash, status: 'ACTIVE',
        registered_by: walletAddress, registered_at: now,
        raw_json: { ingredient_id: ingId, ...form, metadata_hash, status: 'ACTIVE', registered_by: walletAddress, registered_at: now },
      });

      router.push('/ingredients');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to register ingredient.');
    } finally {
      setSubmitting(false);
    }
  }

  const T = ({ label, name, placeholder, required = false, rows = 0 }: any) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}{required && ' *'}</label>
      {rows ? (
        <textarea className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={rows} placeholder={placeholder} value={(form as any)[name]}
          onChange={(e) => set(name, e.target.value)} required={required} />
      ) : (
        <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder={placeholder} value={(form as any)[name]}
          onChange={(e) => set(name, e.target.value)} required={required} />
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">New Feed Ingredient</h2>
        <p className="text-sm text-muted-foreground">Register a feed ingredient for ration optimization.</p>
      </div>
      <Card padding="md"><CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Farm *</label>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.farm_id} onChange={(e) => set('farm_id', e.target.value)} required>
              <option value="">Select farm…</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <T label="Ingredient name" name="name" placeholder="e.g. Soybean Meal (47% CP)" required />
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Category</label>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <T label="Nutrient profile summary *" name="nutrient_profile_summary" rows={4}
            placeholder="e.g. CP 47%, ME 2200 kcal/kg, Lysine 2.9%, Met+Cys 1.3%, Ca 0.3%, P 0.65%. Amino acid balance suitable for monogastrics." required />
          <T label="Safety summary" name="safety_summary" rows={2}
            placeholder="e.g. Low aflatoxin risk if properly stored. Max inclusion 35% for layers due to trypsin inhibitors unless heat-treated." />
          <T label="Availability summary" name="availability_summary" rows={2}
            placeholder="e.g. Available year-round. Procurement from 3 local suppliers. Lead time 2–5 days." />
          <T label="Cost summary" name="cost_summary"
            placeholder="e.g. ₦680/kg as of June 2026. Seasonal variation up to 20% during rainy season." />
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submitting}>Register Ingredient</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
