'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { publishFeedStandardVersion, setCurrentFeedStandardVersion } from '@/lib/genlayer/nutrigenContract';
import { generateEntityId } from '@/lib/nutrigen/feedPacket';
import { generateWallet } from '@/lib/nutrigen/wallet';
import { GENLAYER_EXPLORER_URL } from '@/lib/genlayer/config';

const SEVERITIES = ['ADVISORY', 'WARNING', 'CRITICAL'];

interface Farm { id: string; farm_id: string; name: string; }

export default function NewFeedStandardPage() {
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState('');
  const [standardId, setStandardId] = useState('');
  const [version, setVersion] = useState('1');
  const [title, setTitle] = useState('');
  const [speciesScope, setSpeciesScope] = useState('');
  const [productionStageScope, setProductionStageScope] = useState('');
  const [severity, setSeverity] = useState('WARNING');
  const [nutrientTargetRules, setNutrientTargetRules] = useState('');
  const [ingredientLimitRules, setIngredientLimitRules] = useState('');
  const [toxinRules, setToxinRules] = useState('');
  const [healthEscalationRules, setHealthEscalationRules] = useState('');
  const [costRules, setCostRules] = useState('');
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ standardId: string; txHash: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('nutrigen_wallet');
    if (stored) setWallet(JSON.parse(stored));
    const supabase = createClient();
    supabase.from('farms').select('id, farm_id, name').eq('status', 'ACTIVE').then(({ data }) => setFarms(data ?? []));
    setStandardId(generateEntityId('std'));
  }, []);

  function handleGenerateWallet() {
    const w = generateWallet();
    sessionStorage.setItem('nutrigen_wallet', JSON.stringify(w));
    setWallet(w);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;
    setError('');
    setLoading(true);
    try {
      const selectedFarm = farms.find(f => f.farm_id === farmId);
      const result = await publishFeedStandardVersion({ farm_id: farmId, standard_id: standardId, version, title, species_scope: speciesScope, production_stage_scope: productionStageScope, severity, nutrient_target_rules: nutrientTargetRules, ingredient_limit_rules: ingredientLimitRules, toxin_and_anti_nutrient_rules: toxinRules, health_escalation_rules: healthEscalationRules, cost_and_availability_rules: costRules }, wallet.privateKey);
      if (makeCurrent) {
        await setCurrentFeedStandardVersion(farmId, standardId, version, wallet.privateKey);
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('feed_standard_versions').upsert({
        standard_id: standardId,
        farm_id: selectedFarm?.id,
        farm_chain_id: farmId,
        version,
        title,
        species_scope: speciesScope,
        production_stage_scope: productionStageScope,
        severity,
        nutrient_target_rules: nutrientTargetRules,
        ingredient_limit_rules: ingredientLimitRules,
        toxin_rules: toxinRules,
        health_escalation_rules: healthEscalationRules,
        cost_rules: costRules,
        is_current: makeCurrent,
        status: 'ACTIVE',
        user_id: user?.id,
        tx_hash: result.txHash,
        explorer_url: `${GENLAYER_EXPLORER_URL}/tx/${result.txHash}`,
      });
      setSuccess({ standardId, txHash: result.txHash });
    } catch (err: any) {
      setError(err.message ?? 'Failed to publish standard');
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Publish Feed Standard</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🔑</div>
          <h2 className="font-semibold text-gray-900 mb-2">Wallet Required</h2>
          <p className="text-sm text-gray-600 mb-5">Generate a wallet to sign blockchain transactions.</p>
          <button onClick={handleGenerateWallet} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">Generate Wallet</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Standard Published!</h2>
          <a href={`${GENLAYER_EXPLORER_URL}/tx/${success.txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm font-medium mt-2 inline-block">View Transaction ↗</a>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/feed-standards" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">View All Standards</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/feed-standards" className="text-gray-400 hover:text-gray-600 text-sm">Feed Standards</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 text-sm font-medium">Publish New Standard</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Publish Feed Standard</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm <span className="text-red-500">*</span></label>
            <select required value={farmId} onChange={e => setFarmId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select a farm</option>
              {farms.map(f => <option key={f.farm_id} value={f.farm_id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Version <span className="text-red-500">*</span></label>
            <input required value={version} onChange={e => setVersion(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 1, 2, 1.1" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Standard ID</label>
          <input value={standardId} onChange={e => setStandardId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Broiler Finisher Phase Feed Standard v2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Species Scope <span className="text-red-500">*</span></label>
            <input required value={speciesScope} onChange={e => setSpeciesScope(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Poultry, All, Cattle" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Production Stage Scope</label>
            <input value={productionStageScope} onChange={e => setProductionStageScope(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Finisher, All" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Severity</label>
          <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nutrient Target Rules</label>
          <textarea value={nutrientTargetRules} onChange={e => setNutrientTargetRules(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="CP min 20%, ME min 3000 kcal/kg, Calcium 0.9-1.1%..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Limit Rules</label>
          <textarea value={ingredientLimitRules} onChange={e => setIngredientLimitRules(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Max soybean inclusion: 35%; Max fish meal: 5%..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Toxin / Anti-nutrient Rules</label>
          <textarea value={toxinRules} onChange={e => setToxinRules(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Aflatoxin max 20 ppb; Trypsin inhibitor must be heat-inactivated..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Health Escalation Rules</label>
          <textarea value={healthEscalationRules} onChange={e => setHealthEscalationRules(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Any reported respiratory illness → require vet review before feed change..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost & Availability Rules</label>
          <textarea value={costRules} onChange={e => setCostRules(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Prefer locally available ingredients; max ration cost $0.45/kg DM..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="makeCurrent" checked={makeCurrent} onChange={e => setMakeCurrent(e.target.checked)} className="rounded" />
          <label htmlFor="makeCurrent" className="text-sm text-gray-700">Set as current standard for this farm</label>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg font-semibold transition-colors">
            {loading ? 'Publishing to blockchain...' : 'Publish Standard'}
          </button>
          <Link href="/feed-standards" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
