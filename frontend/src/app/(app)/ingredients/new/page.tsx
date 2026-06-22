'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { registerFeedIngredient } from '@/lib/genlayer/nutrigenContract';
import { generateEntityId } from '@/lib/nutrigen/feedPacket';
import { generateWallet } from '@/lib/nutrigen/wallet';
import { syncFeedIngredient } from '@/lib/nutrigen/contractSync';
import { GENLAYER_EXPLORER_URL } from '@/lib/genlayer/config';

const CATEGORIES = ['Cereal', 'Protein Meal', 'Roughage', 'Mineral', 'Vitamin Premix', 'Oil', 'By-product', 'Other'];

interface Farm { id: string; name: string; }

export default function NewIngredientPage() {
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [nutrientProfile, setNutrientProfile] = useState('');
  const [safetySummary, setSafetySummary] = useState('');
  const [availabilitySummary, setAvailabilitySummary] = useState('');
  const [costSummary, setCostSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ ingredientId: string; txHash: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('nutrigen_wallet');
    if (stored) setWallet(JSON.parse(stored));
    const supabase = createClient();
    supabase.from('farms').select('id, name').eq('status', 'ACTIVE').then(({ data }) => setFarms(data ?? []));
  }, []);

  function handleGenerateWallet() {
    const w = generateWallet();
    localStorage.setItem('nutrigen_wallet', JSON.stringify(w));
    setWallet(w);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;
    setError('');
    setLoading(true);
    try {
      const ingredientId = generateEntityId('ingredient');
      
      const result = await registerFeedIngredient({ ingredient_id: ingredientId, farm_id: farmId, name, category, nutrient_profile_summary: nutrientProfile, safety_summary: safetySummary, availability_summary: availabilitySummary, cost_summary: costSummary }, wallet.privateKey);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await syncFeedIngredient(result.txHash, {
        ingredient_id: ingredientId, farm_id: farmId, name, category,
        nutrient_profile_summary: nutrientProfile, safety_summary: safetySummary,
        availability_summary: availabilitySummary, cost_summary: costSummary,
      }, user?.id);
      setSuccess({ ingredientId, txHash: result.txHash });
    } catch (err: any) {
      setError(err.message ?? 'Failed to register ingredient');
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Feed Ingredient</h1>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ingredient Registered!</h2>
          <p className="text-sm text-gray-600">ID: <span className="font-mono text-xs">{success.ingredientId}</span></p>
          <a href={`${GENLAYER_EXPLORER_URL}/tx/${success.txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm font-medium mt-3 inline-block">View Transaction ↗</a>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/ingredients" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">View All Ingredients</Link>
            <Link href="/ingredients/new" onClick={() => { setSuccess(null); setName(''); setCategory(''); setNutrientProfile(''); setSafetySummary(''); setAvailabilitySummary(''); setCostSummary(''); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Add Another</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ingredients" className="text-gray-400 hover:text-gray-600 text-sm">Feed Ingredients</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 text-sm font-medium">Add New Ingredient</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Add Feed Ingredient</h1>
      <p className="text-gray-500 text-sm mb-5">Register ingredient nutritional data for AI-powered ration optimization.</p>

      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-5 text-xs text-green-700">
        Wallet: <span className="font-mono">{wallet.address}</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm <span className="text-red-500">*</span></label>
            <select required value={farmId} onChange={e => setFarmId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select a farm</option>
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
            <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name <span className="text-red-500">*</span></label>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Soybean Meal (44% CP), Maize Grain" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nutrient Profile Summary <span className="text-red-500">*</span></label>
          <textarea required value={nutrientProfile} onChange={e => setNutrientProfile(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. CP: 44%, ME: 2240 kcal/kg, Lysine: 2.8%, Methionine: 0.65%, Phosphorus: 0.65%..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Safety Summary</label>
          <textarea value={safetySummary} onChange={e => setSafetySummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Any anti-nutritional factors, toxin limits, processing requirements..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability Summary</label>
          <textarea value={availabilitySummary} onChange={e => setAvailabilitySummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Current stock, seasonal availability, supplier reliability..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Summary</label>
          <input value={costSummary} onChange={e => setCostSummary(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. $420/tonne, volatile — peaks in Q3" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg font-semibold transition-colors">
            {loading ? 'Registering on blockchain...' : 'Add Ingredient'}
          </button>
          <Link href="/ingredients" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
