'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateWallet, storeWallet } from '@/lib/nutrigen/wallet';

export default function OnboardingPage() {
  const [step, setStep] = useState<'generating' | 'ready'>('generating');
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if wallet already exists in session
    const stored = sessionStorage.getItem('nutrigen_wallet');
    if (stored) {
      router.push('/dashboard');
      return;
    }
    // Generate a fresh wallet
    const w = generateWallet();
    storeWallet(w);
    setWallet(w);
    setStep('ready');
  }, [router]);

  async function saveAndContinue() {
    if (!wallet) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        wallet_address: wallet.address,
        updated_at: new Date().toISOString(),
      });
    }
    router.push('/dashboard');
  }

  function copyKey() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
            <span className="text-2xl">🌱</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Nutrigen</h1>
          <p className="text-gray-500 mt-1 text-sm">Your GenLayer signing wallet has been created</p>
        </div>

        {step === 'generating' && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Generating your wallet...</p>
          </div>
        )}

        {step === 'ready' && wallet && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 font-semibold text-sm mb-1">Save your private key</p>
              <p className="text-amber-700 text-xs">This key signs your transactions on GenLayer StudioNet. It is stored in your browser session only. Copy it somewhere safe — you will need it to sign on-chain actions.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Wallet Address</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-xs text-gray-700 break-all">{wallet.address}</div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Private Key</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-xs text-gray-700 break-all blur-sm hover:blur-none transition-all select-all">{wallet.privateKey}</div>
              <button onClick={copyKey} className="mt-2 text-xs text-green-600 hover:underline">
                {copied ? 'Copied!' : 'Copy private key'}
              </button>
            </div>

            <button
              onClick={saveAndContinue}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              I have saved my key — Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
