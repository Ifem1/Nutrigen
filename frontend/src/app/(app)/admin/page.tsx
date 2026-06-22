'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getContractSummary } from '@/lib/genlayer/nutrigenContract';
import { NUTRIGEN_CONTRACT_ADDRESS, GENLAYER_RPC_URL, GENLAYER_EXPLORER_URL, GENLAYER_CHAIN_ID } from '@/lib/genlayer/config';
import { generateWallet } from '@/lib/nutrigen/wallet';

interface ContractTx {
  id: string;
  tx_hash: string;
  method: string;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [contractSummary, setContractSummary] = useState<any>(null);
  const [txs, setTxs] = useState<ContractTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('nutrigen_wallet');
    if (stored) setWallet(JSON.parse(stored));

    async function load() {
      try {
        const summary = await getContractSummary();
        setContractSummary(summary);
      } catch (err) {
        console.error('Could not fetch contract summary', err);
      }
      const supabase = createClient();
      const { data } = await supabase.from('contract_transactions').select('*').order('created_at', { ascending: false }).limit(20);
      setTxs(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleGenerateWallet() {
    const w = generateWallet();
    localStorage.setItem('nutrigen_wallet', JSON.stringify(w));
    setWallet(w);
  }

  async function handlePause() {
    setError('Pause/Unpause functions are not currently exposed on this contract version.');
  }

  async function handleUnpause() {
    setError('Pause/Unpause functions are not currently exposed on this contract version.');
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Contract management and system overview</p>
      </div>

      {!wallet && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 text-sm">Wallet not connected</p>
            <p className="text-xs text-gray-600 mt-0.5">Required to execute owner-only contract functions</p>
          </div>
          <button onClick={handleGenerateWallet} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Generate Wallet</button>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">{message}</div>}

      {/* Contract Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Contract Information</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Contract Address</p>
            <a href={`${GENLAYER_EXPLORER_URL}/address/${NUTRIGEN_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="font-mono text-green-600 hover:underline text-xs">{NUTRIGEN_CONTRACT_ADDRESS} ↗</a>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Chain ID</p>
            <p className="font-mono text-gray-900">{GENLAYER_CHAIN_ID} (StudioNet)</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">RPC URL</p>
            <p className="font-mono text-gray-700 text-xs break-all">{GENLAYER_RPC_URL}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Explorer</p>
            <a href={GENLAYER_EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-xs">{GENLAYER_EXPLORER_URL} ↗</a>
          </div>
          {contractSummary?.owner && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Owner</p>
              <p className="font-mono text-gray-700 text-xs">{contractSummary.owner}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 text-xs mb-1">Pause Status</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${contractSummary?.paused ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {contractSummary?.paused ? 'PAUSED' : 'ACTIVE'}
            </span>
          </div>
        </div>

        {wallet && (
          <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
            <button onClick={handlePause} disabled={actionLoading || contractSummary?.paused} className="bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {actionLoading ? 'Processing...' : '⏸ Pause Contract'}
            </button>
            <button onClick={handleUnpause} disabled={actionLoading || !contractSummary?.paused} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {actionLoading ? 'Processing...' : '▶ Unpause Contract'}
            </button>
          </div>
        )}
      </div>

      {/* Contract Stats */}
      {contractSummary && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Contract Summary Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(contractSummary).filter(([k]) => !['owner', 'paused', 'address'].includes(k)).map(([key, val]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">{String(val)}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Contract Transactions</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading transactions...</div>
        ) : txs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No transactions recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Tx Hash</th>
                  <th className="px-5 py-3 text-left">Method</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {txs.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <a href={`${GENLAYER_EXPLORER_URL}/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-green-600 hover:underline">
                        {tx.tx_hash?.slice(0, 18)}... ↗
                      </a>
                    </td>
                    <td className="px-5 py-3 text-gray-700 font-mono text-xs">{tx.method}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : tx.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{tx.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
