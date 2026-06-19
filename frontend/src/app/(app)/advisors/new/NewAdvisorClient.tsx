'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { registerFeedAdvisor, waitForTransaction } from '@/lib/genlayer/client';
import { buildMetadataHash } from '@/lib/nutrigen/feedPacket';
import { createClient } from '@/lib/supabase/client';

export function NewAdvisorClient() {
  const router = useRouter();
  const { walletAddress } = useAuthStore();
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    farm_id: '',
    name: '',
    credential_summary: '',
    scope_summary: '',
    wallet: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    createClient()
      .from('farms').select('id, name').eq('status', 'ACTIVE')
      .then(({ data }) => {
        setFarms(data ?? []);
      });
  }, []);

  // Pre-fill wallet with connected wallet when farm is selected
  useEffect(() => {
    if (walletAddress && !form.wallet) {
      setForm((f) => ({ ...f, wallet: walletAddress }));
    }
  }, [walletAddress]);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const privateKey = sessionStorage.getItem('nutrigen_pk') ?? '';
    if (!privateKey || !walletAddress) { setError('Wallet not connected. Please log out and back in.'); return; }
    if (!form.farm_id) { setError('Please select a farm.'); return; }

    setSubmitting(true); setError('');
    try {
      const now = new Date().toISOString();
      const metadata_hash = await buildMetadataHash({ ...form, registered_at: now });

      const txHash = await registerFeedAdvisor({
        advisor_id: '',
        farm_id: form.farm_id,
        name: form.name,
        credential_summary: form.credential_summary,
        scope_summary: form.scope_summary,
        wallet: form.wallet || walletAddress,
        metadata_hash,
        registered_at: now,
      }, privateKey);

      const receipt = await waitForTransaction(txHash);
      if (receipt.status !== 'ACCEPTED') throw new Error('Transaction not accepted: ' + receipt.status);

      const advisorId = (receipt.data as any)?.result ?? txHash;

      await createClient().from('feed_advisors').upsert({
        id: advisorId,
        farm_id: form.farm_id,
        name: form.name,
        credential_summary: form.credential_summary,
        scope_summary: form.scope_summary,
        wallet: form.wallet || walletAddress,
        metadata_hash,
        status: 'ACTIVE',
        registered_by: walletAddress,
        registered_at: now,
        raw_json: {
          advisor_id: advisorId,
          farm_id: form.farm_id,
          name: form.name,
          credential_summary: form.credential_summary,
          scope_summary: form.scope_summary,
          wallet: form.wallet || walletAddress,
          metadata_hash,
          status: 'ACTIVE',
          registered_by: walletAddress,
          registered_at: now,
        },
      });

      router.push('/advisors');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to register advisor.');
    } finally {
      setSubmitting(false);
    }
  }

  const F = ({ label, name, placeholder, required = false, rows = 0 }: any) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}{required && ' *'}
      </label>
      {rows ? (
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={rows} placeholder={placeholder} value={(form as any)[name]}
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
        <h2 className="text-xl font-bold text-foreground">Register Feed Advisor</h2>
        <p className="text-sm text-muted-foreground">
          Advisors are nutritionists or vets authorised to submit and review feed optimization requests.
        </p>
      </div>

      <Card padding="md"><CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Farm *</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.farm_id} onChange={(e) => set('farm_id', e.target.value)} required
            >
              <option value="">Select farm…</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          <F label="Full name" name="name" placeholder="e.g. Dr. Amaka Okonkwo" required />

          <F label="Credentials summary" name="credential_summary" rows={2}
            placeholder="e.g. BVSc (University of Ibadan, 2012), MSc Animal Nutrition (Ahmadu Bello University, 2015). 10 years ruminant nutrition consultancy." />

          <F label="Scope summary" name="scope_summary" rows={2}
            placeholder="e.g. Authorised for beef cattle and small ruminant ration formulation. Licensed to issue health escalation recommendations." />

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Wallet address</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="0x… (defaults to your connected wallet)"
              value={form.wallet}
              onChange={(e) => set('wallet', e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank to use your current wallet ({walletAddress?.slice(0, 10)}…).
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submitting}>Register Advisor</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
