'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createFarm } from '@/lib/genlayer/nutrigenContract';
import { generateEntityId } from '@/lib/nutrigen/feedPacket';
import { generateWallet } from '@/lib/nutrigen/wallet';
import { syncFarm } from '@/lib/nutrigen/contractSync';
import { GENLAYER_EXPLORER_URL } from '@/lib/genlayer/config';
import { createClient } from '@/lib/supabase/client';

const FARM_TYPES = ['Poultry', 'Cattle', 'Dairy', 'Swine', 'Aquaculture', 'Mixed', 'Other'];

export default function NewFarmPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [name, setName] = useState('');
  const [farmType, setFarmType] = useState('');
  const [locationContext, setLocationContext] = useState('');
  const [metadataHash, setMetadataHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ farmId: string; txHash: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('nutrigen_wallet');
    if (stored) {
      setWallet(JSON.parse(stored));
    }
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
      const farmId = generateEntityId('farm');
      const result = await createFarm({ farm_id: farmId, name, farm_type: farmType, location_context: locationContext, metadata_hash: metadataHash || '' }, wallet.privateKey);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await syncFarm(result.txHash, {
        farm_id: farmId, name, farm_type: farmType,
        location_context: locationContext, owner_wallet: wallet.address,
        metadata_hash: metadataHash || '',
      }, user?.id);
      setSuccess({ farmId, txHash: result.txHash });
    } catch (err: any) {
      setError(err.message ?? 'Failed to register farm');
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Register New Farm</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mt-8">
          <div className="text-4xl mb-3">🔑</div>
          <h2 className="font-semibold text-gray-900 mb-2">Wallet Required</h2>
          <p className="text-sm text-gray-600 mb-5">You need a wallet to sign blockchain transactions. Generate one automatically — your key is stored locally only.</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Farm Registered!</h2>
          <p className="text-sm text-gray-600 mb-1">Farm ID: <span className="font-mono text-xs">{success.farmId}</span></p>
          <div className="mt-4">
            <a href={`${GENLAYER_EXPLORER_URL}/tx/${success.txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm font-medium">View Transaction ↗</a>
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/farms" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">View All Farms</Link>
            <Link href="/farms/new" onClick={() => setSuccess(null)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Register Another</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/farms" className="text-gray-400 hover:text-gray-600 text-sm">Farms</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 text-sm font-medium">Register New Farm</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Register New Farm</h1>
      <p className="text-gray-500 text-sm mb-6">Farm data is stored on GenLayer blockchain and synced to your account.</p>

      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-5 text-xs text-green-700">
        Wallet: <span className="font-mono">{wallet.address}</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name <span className="text-red-500">*</span></label>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Greenfield Poultry Farm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Farm Type <span className="text-red-500">*</span></label>
          <select required value={farmType} onChange={e => setFarmType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select farm type</option>
            {FARM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location / Context</label>
          <textarea value={locationContext} onChange={e => setLocationContext(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Describe farm location, climate, operational context..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metadata Hash <span className="text-gray-400 font-normal">(optional)</span></label>
          <input value={metadataHash} onChange={e => setMetadataHash(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0x..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg font-semibold transition-colors">
            {loading ? 'Registering on blockchain...' : 'Register Farm'}
          </button>
          <Link href="/farms" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
