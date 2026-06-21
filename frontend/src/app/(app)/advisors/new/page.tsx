'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { registerFeedAdvisor } from '@/lib/genlayer/nutrigenContract';
import { generateEntityId } from '@/lib/nutrigen/feedPacket';
import { generateWallet } from '@/lib/nutrigen/wallet';
import { GENLAYER_EXPLORER_URL } from '@/lib/genlayer/config';

interface Farm { id: string; farm_id: string; name: string; }

export default function NewAdvisorPage() {
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState('');
  const [name, setName] = useState('');
  const [credentialSummary, setCredentialSummary] = useState('');
  const [scopeSummary, setScopeSummary] = useState('');
  const [advisorWallet, setAdvisorWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ advisorId: string; txHash: string } | null>(null);

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
      const advisorId = generateEntityId('advisor');
      const selectedFarm = farms.find(f => f.farm_id === farmId);
      const result = await registerFeedAdvisor({ advisor_id: advisorId, farm_id: farmId, name, credential_summary: credentialSummary, scope_summary: scopeSummary, wallet: advisorWallet }, wallet.privateKey);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('feed_advisors').upsert({
        advisor_id: advisorId,
        farm_id: selectedFarm?.id,
        farm_chain_id: farmId,
        name,
        credential_summary: credentialSummary,
        scope_summary: scopeSummary,
        wallet_address: advisorWallet,
        status: 'ACTIVE',
        user_id: user?.id,
        tx_hash: result.txHash,
        explorer_url: `${GENLAYER_EXPLORER_URL}/tx/${result.txHash}`,
      });
      setSuccess({ advisorId, txHash: result.txHash });
    } catch (err: any) {
      setError(err.message ?? 'Failed to register advisor');
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Register Feed Advisor</h1>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Advisor Registered!</h2>
          <a href={`${GENLAYER_EXPLORER_URL}/tx/${success.txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm font-medium mt-2 inline-block">View Transaction ↗</a>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/advisors" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">View All Advisors</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/advisors" className="text-gray-400 hover:text-gray-600 text-sm">Feed Advisors</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 text-sm font-medium">Register Advisor</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Register Feed Advisor</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Farm <span className="text-red-500">*</span></label>
          <select required value={farmId} onChange={e => setFarmId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select a farm</option>
            {farms.map(f => <option key={f.farm_id} value={f.farm_id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Advisor Full Name <span className="text-red-500">*</span></label>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Dr. Jane Mwangi, BVSc" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Credential Summary</label>
          <textarea value={credentialSummary} onChange={e => setCredentialSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. BVSc, MSc Animal Nutrition, 12 years poultry experience, licensed KVB..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scope Summary</label>
          <textarea value={scopeSummary} onChange={e => setScopeSummary(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Poultry nutrition and health, review broiler and layer rations..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Advisor Wallet Address <span className="text-red-500">*</span></label>
          <input required value={advisorWallet} onChange={e => setAdvisorWallet(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0x..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg font-semibold transition-colors">
            {loading ? 'Registering on blockchain...' : 'Register Advisor'}
          </button>
          <Link href="/advisors" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
