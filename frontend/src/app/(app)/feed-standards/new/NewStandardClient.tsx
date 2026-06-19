'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { publishFeedStandardVersion, waitForTransaction } from '@/lib/genlayer/client';
import { sha256Hex, buildMetadataHash } from '@/lib/nutrigen/feedPacket';
import { createClient } from '@/lib/supabase/client';

export function NewStandardClient() {
  const router = useRouter();
  const { walletAddress } = useAuthStore();
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    farm_id: '', standard_id: '', version: '1.0', title: '',
    species_scope: '', production_stage_scope: '', severity: 'MEDIUM',
    nutrient_target_rules: '', ingredient_limit_rules: '',
    toxin_and_anti_nutrient_rules: '', health_escalation_rules: '',
    cost_and_availability_rules: '',
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
      const standard_hash = await sha256Hex(JSON.stringify({
        nutrient_target_rules: form.nutrient_target_rules,
        ingredient_limit_rules: form.ingredient_limit_rules,
        toxin_and_anti_nutrient_rules: form.toxin_and_anti_nutrient_rules,
        health_escalation_rules: form.health_escalation_rules,
        cost_and_availability_rules: form.cost_and_availability_rules,
      }));
      const metadata_hash = await buildMetadataHash({ ...form, published_at: now });

      const txHash = await publishFeedStandardVersion({
        ...form, standard_hash, metadata_hash, published_at: now,
      }, privateKey);
      const receipt = await waitForTransaction(txHash);
      if (receipt.status !== 'ACCEPTED') throw new Error('Transaction not accepted');

      await createClient().from('feed_standard_versions').upsert({
        farm_id: form.farm_id, standard_id: form.standard_id, version: form.version,
        title: form.title, species_scope: form.species_scope,
        production_stage_scope: form.production_stage_scope, severity: form.severity,
        nutrient_target_rules: form.nutrient_target_rules,
        ingredient_limit_rules: form.ingredient_limit_rules,
        toxin_and_anti_nutrient_rules: form.toxin_and_anti_nutrient_rules,
        health_escalation_rules: form.health_escalation_rules,
        cost_and_availability_rules: form.cost_and_availability_rules,
        standard_hash, metadata_hash, status: 'ACTIVE', is_current: true,
        published_by: walletAddress, published_at: now,
        raw_json: {
          ...form, standard_hash, metadata_hash, status: 'ACTIVE',
          is_current: true, published_by: walletAddress, published_at: now,
        },
      });

      router.push('/feed-standards');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to publish standard.');
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Publish Feed Standard</h2>
        <p className="text-sm text-muted-foreground">Create a versioned nutritional standard for the AI optimizer to enforce.</p>
      </div>
      <Card padding="md"><CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Farm *</label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.farm_id} onChange={(e) => set('farm_id', e.target.value)} required>
                <option value="">Select farm…</option>
                {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <T label="Standard ID *" name="standard_id" placeholder="e.g. BROILER-NRC-2024" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <T label="Version *" name="version" placeholder="e.g. 1.0" required />
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Severity</label>
              <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.severity} onChange={(e) => set('severity', e.target.value)}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <T label="Title *" name="title" placeholder="e.g. NRC Broiler Starter Standard 2024" required />
          <T label="Species scope" name="species_scope" placeholder="e.g. Poultry (Broiler)" />
          <T label="Production stage scope" name="production_stage_scope" placeholder="e.g. Starter (day 1–21)" />

          <hr className="border-border" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Standard Rules</p>

          <T label="Nutrient target rules *" name="nutrient_target_rules" rows={4}
            placeholder="e.g. CP ≥22%, ME ≥3000 kcal/kg, Lysine ≥1.3%, Ca 0.9–1.1%, Available P ≥0.45%, Na 0.15–0.2%." required />
          <T label="Ingredient limit rules" name="ingredient_limit_rules" rows={3}
            placeholder="e.g. Soy max 35%, Corn max 65%, Fishmeal max 5%, Cassava max 10%." />
          <T label="Toxin and anti-nutrient rules" name="toxin_and_anti_nutrient_rules" rows={3}
            placeholder="e.g. Aflatoxin ≤10ppb. Reject raw soybean. Heat-treat any tannin-containing ingredient." />
          <T label="Health escalation rules" name="health_escalation_rules" rows={3}
            placeholder="e.g. Escalate to vet if FCR >2.5 persists 3 days. Halt new batches if mortality >3%/week." />
          <T label="Cost and availability rules" name="cost_and_availability_rules" rows={3}
            placeholder="e.g. Target feed cost ≤₦120/kg. Flag if ingredient unavailable >7 days. Prefer local suppliers." />

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={submitting}>Publish Standard</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
