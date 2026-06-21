'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { registerLivestockBatch } from '@/lib/genlayer/nutrigenContract';
import { generateEntityId } from '@/lib/nutrigen/feedPacket';
import { generateWallet } from '@/lib/nutrigen/wallet';
import { syncLivestockBatch } from '@/lib/nutrigen/contractSync';
import { GENLAYER_EXPLORER_URL } from '@/lib/genlayer/config';

const SPECIES = ['Poultry', 'Cattle', 'Sheep', 'Goat', 'Swine', 'Fish', 'Other'];
const STAGES = ['Starter', 'Grower', 'Finisher', 'Layer', 'Broiler', 'Dairy Lactation', 'Fattening', 'Maintenance', 'Gestation'];

interface Farm { id: string; farm_id: string; name: string; }

export default function NewBatchPage() {
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState('');
  const [species, setSpecies] = useState('');
  const [breedSummary, setBreedSummary] = useState('');
  const [productionStage, setProductionStage] = useState('');
  const [productionGoal, setProductionGoal] = useState('');
  const [headCount, setHeadCount] = useState('');
  const [weightSummary, setWeightSummary] = useState('');
  const [healthStatusSummary, setHealthStatusSummary] = useState('');
  const [feedingConstraints, setFeedingConstraints] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ batchId: string; txHash: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('nutrigen_wallet');
    if (stored) setWallet(JSON.parse(stored));
    const supabase = createClient();
    supabase.from('farms').select('id, farm_id, name').eq('status', 'ACTIVE').then(({ data }) => setFarms(data ?? []));
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
      const batchId = generateEntityId('batch');
      const selectedFarm = farms.find(f => f.farm_id === farmId);
      const result = await registerLivestockBatch({ batch_id: batchId, farm_id: farmId, species, breed_summary: breedSummary, production_stage: productionStage, production_goal: productionGoal, head_count: parseInt(headCount), weight_summary: weightSummary, health_status_summary: healthStatusSummary, feeding_constraints: feedingConstraints }, wallet.privateKey);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await syncLivestockBatch(result.txHash, {
        batch_id: batchId, farm_id: farmId, species,
        breed_summary: breedSummary, production_stage: productionStage,
        production_goal: productionGoal, head_count: parseInt(headCount),
        weight_summary: weightSummary, health_status_summary: healthStatusSummary,
        feeding_constraints: feedingConstraints,
      }, user?.id);
      setSuccess({ batchId, txHash: result.txHash });
    } catch (err: any) {
      setError(err.message ?? 'Failed to register batch');
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Register Livestock Batch</h1>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Batch Registered!</h2>
          <p className="text-sm text-gray-600 mb-1">Batch ID: <span className="font-mono text-xs">{success.batchId}</span></p>
          <a href={`${GENLAYER_EXPLORER_URL}/tx/${success.txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm font-medium mt-3 inline-block">View Transaction ↗</a>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/batches" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">View All Batches</Link>
            <Link href="/optimizer" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Optimize Feed</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/batches" className="text-gray-400 hover:text-gray-600 text-sm">Livestock Batches</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 text-sm font-medium">Register New Batch</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Register Livestock Batch</h1>
      <p className="text-gray-500 text-sm mb-5">Record your animal group details for feed optimization.</p>

      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-5 text-xs text-green-700">
        Wallet: <span className="font-mono">{wallet.address}</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm <span className="text-red-500">*</span></label>
            <select required value={farmId} onChange={e => setFarmId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select a farm</option>
              {farms.map(f => <option key={f.farm_id} value={f.farm_id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Species <span className="text-red-500">*</span></label>
            <select required value={species} onChange={e => setSpecies(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select species</option>
              {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Production Stage <span className="text-red-500">*</span></label>
            <select required value={productionStage} onChange={e => setProductionStage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select stage</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Breed Summary</label>
          <input value={breedSummary} onChange={e => setBreedSummary(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Ross 308 broiler, commercial hybrid" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Production Goal <span className="text-red-500">*</span></label>
          <input required value={productionGoal} onChange={e => setProductionGoal(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Reach 2.5kg live weight in 42 days" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Head Count <span className="text-red-500">*</span></label>
            <input required type="number" min="1" value={headCount} onChange={e => setHeadCount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. 5000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight Summary</label>
            <input value={weightSummary} onChange={e => setWeightSummary(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Avg 0.8kg at day 14" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Health Status Summary</label>
          <textarea value={healthStatusSummary} onChange={e => setHealthStatusSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Describe current health status, vaccinations, any conditions..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Feeding Constraints</label>
          <textarea value={feedingConstraints} onChange={e => setFeedingConstraints(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Any dietary restrictions, allergen concerns, or feeding limitations..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg font-semibold transition-colors">
            {loading ? 'Registering on blockchain...' : 'Register Batch'}
          </button>
          <Link href="/batches" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
