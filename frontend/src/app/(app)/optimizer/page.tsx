'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { submitAndOptimizeFeed, waitForTransaction } from '@/lib/genlayer/client';
import { buildRationHash, buildEvidenceManifestHash } from '@/lib/nutrigen/feedPacket';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SelectItem { id: string; label: string; }

export default function OptimizerPage() {
  const router = useRouter();
  const { walletAddress } = useAuthStore();

  const [farms, setFarms] = useState<SelectItem[]>([]);
  const [batches, setBatches] = useState<SelectItem[]>([]);
  const [advisors, setAdvisors] = useState<SelectItem[]>([]);
  const [standards, setStandards] = useState<SelectItem[]>([]);
  const [ingredients, setIngredients] = useState<SelectItem[]>([]);

  const [farmId, setFarmId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const [form, setForm] = useState({
    objective_summary: '',
    current_feeding_summary: '',
    available_feed_summary: '',
    candidate_ration_summary: '',
    nutrient_analysis_summary: '',
    cost_constraint_summary: '',
    supply_constraint_summary: '',
    health_context_summary: '',
    environment_context_summary: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  // Load farms
  useEffect(() => {
    createClient().from('farms').select('id, name').eq('status', 'ACTIVE')
      .then(({ data }) => setFarms((data ?? []).map((f: any) => ({ id: f.id, label: f.name }))));
  }, []);

  // Load batches/advisors/standards/ingredients when farm changes
  useEffect(() => {
    if (!farmId) { setBatches([]); setAdvisors([]); setStandards([]); setIngredients([]); return; }
    const sb = createClient();
    Promise.all([
      sb.from('livestock_batches').select('id, species, production_stage').eq('farm_id', farmId).eq('status', 'ACTIVE'),
      sb.from('feed_advisors').select('id, name').eq('farm_id', farmId).eq('status', 'ACTIVE'),
      sb.from('feed_standard_versions').select('standard_id, version, title').eq('farm_id', farmId).eq('status', 'ACTIVE').eq('is_current', true),
      sb.from('feed_ingredients').select('id, name').eq('farm_id', farmId).eq('status', 'ACTIVE'),
    ]).then(([b, a, s, i]) => {
      setBatches((b.data ?? []).map((x: any) => ({ id: x.id, label: `${x.species} — ${x.production_stage} (${x.id})` })));
      setAdvisors((a.data ?? []).map((x: any) => ({ id: x.id, label: `${x.name} (${x.id})` })));
      setStandards((s.data ?? []).map((x: any) => ({ id: x.standard_id, label: `${x.title} v${x.version}` })));
      setIngredients((i.data ?? []).map((x: any) => ({ id: x.id, label: x.name })));
      setBatchId(''); setAdvisorId(''); setSelectedStandards([]); setSelectedIngredients([]);
    });
  }, [farmId]);

  function toggleMulti(list: string[], setList: (l: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);
  }

  function setF(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!farmId || !batchId || !advisorId || !selectedStandards.length || !selectedIngredients.length) {
      toast.error('Select farm, batch, advisor, at least one standard and one ingredient.');
      return;
    }
    const privateKey = sessionStorage.getItem('nutrigen_pk') ?? '';
    if (!privateKey || !walletAddress) { toast.error('Wallet not connected. Please re-login.'); return; }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const standard_ids_csv = selectedStandards.join(',');
      const ingredient_ids_csv = selectedIngredients.join(',');

      const ration_hash = await buildRationHash({
        farm_id: farmId, batch_id: batchId, advisor_id: advisorId,
        standard_ids_csv, ingredient_ids_csv,
        objective_summary: form.objective_summary,
        candidate_ration_summary: form.candidate_ration_summary,
        nutrient_analysis_summary: form.nutrient_analysis_summary,
      });

      const evidence_manifest_hash = await buildEvidenceManifestHash({
        farm_id: farmId, batch_id: batchId, advisor_id: advisorId,
        current_feeding_summary: form.current_feeding_summary,
        available_feed_summary: form.available_feed_summary,
        cost_constraint_summary: form.cost_constraint_summary,
        supply_constraint_summary: form.supply_constraint_summary,
        health_context_summary: form.health_context_summary,
        environment_context_summary: form.environment_context_summary,
        submitted_at: now,
      });

      setTxStatus('Submitting to GenLayer…');
      const txHash = await submitAndOptimizeFeed({
        request_id: '', farm_id: farmId, batch_id: batchId, advisor_id: advisorId,
        standard_ids_csv, ingredient_ids_csv,
        ...form,
        evidence_manifest_hash, ration_hash,
        submitted_at: now, expires_at: expiresAt, adjudicated_at: now,
      }, privateKey);

      setTxStatus('Waiting for consensus… (up to 2 min)');
      const receipt = await waitForTransaction(txHash, 150_000);
      if (receipt.status !== 'ACCEPTED') throw new Error('Transaction not accepted: ' + receipt.status);

      const requestId = (receipt.data as any)?.result ?? txHash;

      // Mirror request to Supabase
      setTxStatus('Syncing result…');
      await createClient().from('optimization_requests').upsert({
        id: requestId, farm_id: farmId, batch_id: batchId, advisor_id: advisorId,
        standard_ids_csv, ingredient_ids_csv, ...form,
        evidence_manifest_hash, ration_hash,
        submitted_by: walletAddress, submitted_at: now, expires_at: expiresAt,
        status: 'PENDING', tx_hash: txHash,
        raw_json: {
          request_id: requestId, farm_id: farmId, batch_id: batchId, advisor_id: advisorId,
          standard_ids_csv, ingredient_ids_csv, ...form,
          evidence_manifest_hash, ration_hash,
          submitted_by: walletAddress, submitted_at: now, expires_at: expiresAt, status: 'PENDING',
        },
      });

      toast.success('Feed optimization submitted!');
      router.push(`/results/${requestId}`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Submission failed.');
      setSubmitting(false);
      setTxStatus('');
    }
  }

  const TA = ({ label, name, placeholder, required = false }: any) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}{required && ' *'}</label>
      <textarea
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        rows={3} placeholder={placeholder} value={(form as any)[name]}
        onChange={(e) => setF(name, e.target.value)} required={required}
      />
    </div>
  );

  const MultiSelect = ({ label, items, selected, onToggle }: {
    label: string; items: SelectItem[]; selected: string[]; onToggle: (id: string) => void;
  }) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label} *</label>
      {!items.length ? (
        <p className="text-xs text-muted-foreground">No items available. Select a farm first.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selected.includes(item.id)
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border bg-background text-foreground hover:bg-secondary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Feed Optimizer</h2>
        <p className="text-sm text-muted-foreground">Submit a feed optimization request to GenLayer AI consensus.</p>
      </div>

      {submitting && (
        <Card padding="md" className="flex items-center gap-3 bg-brand-50">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          <span className="text-sm font-medium text-brand-700">{txStatus || 'Processing…'}</span>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Context */}
        <Card padding="md"><CardContent className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Farm Context</p>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Farm *</label>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={farmId} onChange={(e) => setFarmId(e.target.value)} required>
              <option value="">Select farm…</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Livestock batch *</label>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={batchId} onChange={(e) => setBatchId(e.target.value)} required disabled={!farmId}>
              <option value="">Select batch…</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Feed advisor *</label>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={advisorId} onChange={(e) => setAdvisorId(e.target.value)} required disabled={!farmId}>
              <option value="">Select advisor…</option>
              {advisors.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </div>

          <MultiSelect
            label="Feed standards (select all that apply)"
            items={standards}
            selected={selectedStandards}
            onToggle={(id) => toggleMulti(selectedStandards, setSelectedStandards, id)}
          />

          <MultiSelect
            label="Available feed ingredients (select all)"
            items={ingredients}
            selected={selectedIngredients}
            onToggle={(id) => toggleMulti(selectedIngredients, setSelectedIngredients, id)}
          />
        </CardContent></Card>

        {/* Summaries */}
        <Card padding="md"><CardContent className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Optimization Context</p>
          <TA label="Optimization objective" name="objective_summary" required
            placeholder="e.g. Maximize daily weight gain to 1.2kg/day for 120 beef cattle (Grower stage, 300–380kg), minimizing cost while meeting NRC standards." />
          <TA label="Current feeding summary" name="current_feeding_summary"
            placeholder="e.g. Currently feeding 4kg/day Corn-Soy finisher mix at ₦105/kg. FCR 8.2. Weight gain 0.8kg/day. Feed changed 6 weeks ago." />
          <TA label="Available feed summary" name="available_feed_summary" required
            placeholder="e.g. Corn (200 bags, ₦78/kg), Soybean Meal 47% (60 bags, ₦682/kg), Wheat Bran (50 bags, ₦45/kg), Mineral Premix (20kg, ₦1200/kg). Palm kernel cake seasonal." />
          <TA label="Candidate ration summary" name="candidate_ration_summary"
            placeholder="e.g. Proposed: 55% Corn, 30% Soybean Meal, 12% Wheat Bran, 3% Mineral Premix. Target CP 16%, ME 2800 kcal/kg. Estimated cost ₦112/kg." />
          <TA label="Nutrient analysis summary" name="nutrient_analysis_summary"
            placeholder="e.g. Proximate analysis from accredited lab. CP 15.8%, ME est. 2760 kcal/kg, Ca 0.65%, P 0.42%, Moisture 11%. Lysine slightly below NRC recommendation." />
          <TA label="Cost constraint summary" name="cost_constraint_summary"
            placeholder="e.g. Max feed cost ₦120/kg. Daily budget ₦420/head. Willing to reduce corn if soy price drops below ₦650/kg." />
          <TA label="Supply constraint summary" name="supply_constraint_summary"
            placeholder="e.g. Palm kernel cake unavailable until October. Soybean Meal supply limited to 3 months. Prefer to avoid imported amino acids." />
          <TA label="Health context summary" name="health_context_summary"
            placeholder="e.g. Vaccinated against FMD and Brucellosis. Mild bloat issue noted in 4 animals last month. No current illness. Vet cleared for new ration trial." />
          <TA label="Environment context summary" name="environment_context_summary"
            placeholder="e.g. Semi-arid savanna, northern Nigeria. Dry season (Nov–Apr). Average temp 38°C day. Feed storage in covered barn. Water from borehole, adequate supply." />
        </CardContent></Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            loading={submitting}
            leftIcon={<FlaskConical className="h-4 w-4" />}
            size="lg"
          >
            Submit for GenLayer Consensus
          </Button>
        </div>
      </form>
    </div>
  );
}
