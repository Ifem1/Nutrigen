'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateWallet } from '@/lib/nutrigen/wallet';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? '');
        setUserId(data.user.id);
      }
    });
    const stored = localStorage.getItem('nutrigen_wallet');
    if (stored) setWallet(JSON.parse(stored));
  }, []);

  function handleGenerateWallet() {
    const w = generateWallet();
    localStorage.setItem('nutrigen_wallet', JSON.stringify(w));
    setWallet(w);
    setShowKey(false);
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-gray-500 text-sm mb-6">Your account and blockchain wallet information</p>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">{email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">User ID</span>
            <span className="text-xs font-mono text-gray-400">{userId.slice(0, 20)}...</span>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Blockchain Wallet</h2>

        {wallet ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Wallet Address (Public)</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                <span className="text-sm font-mono text-gray-800 flex-1 break-all">{wallet.address}</span>
                <button
                  onClick={() => handleCopy(wallet.address, 'address')}
                  className="text-xs text-green-600 hover:text-green-700 font-medium shrink-0"
                >
                  {copied === 'address' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Private Key <span className="text-red-500">(Keep secret — never share)</span></p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                <span className="text-sm font-mono text-gray-800 flex-1 break-all">
                  {showKey ? wallet.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setShowKey(s => !s)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                  {showKey && (
                    <button onClick={() => handleCopy(wallet.privateKey, 'key')} className="text-xs text-green-600 hover:text-green-700 font-medium">
                      {copied === 'key' ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <strong>Important:</strong> Back up your private key somewhere safe. If you generate a new wallet, you will lose access to this one and any on-chain actions it has signed.
            </div>

            <button
              onClick={handleGenerateWallet}
              className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Generate New Wallet (replaces current)
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-4">No wallet generated yet. You need one to sign blockchain transactions.</p>
            <button
              onClick={handleGenerateWallet}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Generate Wallet
            </button>
          </div>
        )}
      </div>

      {/* Network Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Network</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Network</span>
            <span className="font-medium text-gray-900">GenLayer StudioNet</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-gray-500">Chain ID</span>
            <span className="font-mono text-gray-900">61999</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Contract</span>
            <span className="font-mono text-xs text-gray-500">0x6e751Ed6...b7D12</span>
          </div>
        </div>
      </div>
    </div>
  );
}
