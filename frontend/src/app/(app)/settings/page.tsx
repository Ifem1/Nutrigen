'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Copy, Shield, Wallet } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { getSupabaseClient } from '@/lib/supabase/client';
import { unlockWallet, storeWallet } from '@/lib/wallet/storage';
import { createEncryptedWallet } from '@/lib/wallet/generate';

export default function SettingsPage() {
  const { user, profile, walletAddress, setWalletAddress } = useAuthStore();
  const [showExport, setShowExport] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: profile?.full_name ?? '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [generatingWallet, setGeneratingWallet] = useState(false);
  const [genPassword, setGenPassword] = useState('');
  const [showGenForm, setShowGenForm] = useState(false);

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.from('users').update({ full_name: profileForm.full_name }).eq('id', user.id);
      toast.success('Profile updated.');
    } catch { toast.error('Failed to update profile.'); }
    finally { setSavingProfile(false); }
  }

  async function handleGenerateWallet() {
    if (!user || !genPassword) return;
    setGeneratingWallet(true);
    try {
      const { wallet, encrypted } = await createEncryptedWallet(genPassword);
      await storeWallet(user.id, wallet.address, encrypted.encryptedPrivateKey, encrypted.salt, encrypted.iv, encrypted.iterations);
      setWalletAddress(wallet.address);
      setShowGenForm(false);
      setGenPassword('');
      toast.success('Wallet generated and saved!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate wallet.');
    } finally { setGeneratingWallet(false); }
  }

  async function handleExportKey() {
    if (!user || !exportPassword) return;
    setExporting(true);
    try {
      const key = await unlockWallet(user.id, exportPassword);
      setPrivateKey(key);
      setShowExport(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Wrong password.');
    } finally { setExporting(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-foreground">Settings</h2>

      {/* Profile */}
      <Card padding="md" className="space-y-4">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <Input label="Full Name" value={profileForm.full_name} onChange={(e) => setProfileForm({ full_name: e.target.value })} />
        <Input label="Email" value={user?.email ?? ''} disabled hint="Email cannot be changed." />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSaveProfile} loading={savingProfile}>Save Changes</Button>
        </div>
      </Card>

      {/* Wallet */}
      <Card padding="md" className="space-y-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Blockchain Wallet</CardTitle>
            <Badge variant={walletAddress ? 'success' : 'warning'} dot>
              {walletAddress ? 'Active' : 'Not Generated'}
            </Badge>
          </div>
        </CardHeader>

        <div className="rounded-lg bg-secondary/60 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Wallet Address</p>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm text-foreground break-all">{walletAddress ?? '—'}</code>
            {walletAddress && (
              <button onClick={() => { navigator.clipboard.writeText(walletAddress); toast.success('Copied!'); }} className="shrink-0 text-muted-foreground hover:text-foreground">
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* No wallet — show generate button */}
        {!walletAddress && (
          !showGenForm ? (
            <Button leftIcon={<Wallet className="h-4 w-4" />} onClick={() => setShowGenForm(true)}>
              Generate My Wallet
            </Button>
          ) : (
            <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 space-y-3">
              <p className="text-sm font-medium text-brand-800">Enter your account password to encrypt the wallet.</p>
              <Input
                label="Password"
                type="password"
                value={genPassword}
                onChange={(e) => setGenPassword(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setShowGenForm(false); setGenPassword(''); }}>Cancel</Button>
                <Button size="sm" onClick={handleGenerateWallet} loading={generatingWallet} disabled={!genPassword}>
                  Generate & Save Wallet
                </Button>
              </div>
            </div>
          )
        )}

        {/* Has wallet — export key */}
        {walletAddress && !privateKey && (
          !showExport ? (
            <Button variant="outline" size="sm" leftIcon={<Shield className="h-4 w-4" />} onClick={() => setShowExport(true)}>
              Export Private Key
            </Button>
          ) : (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
              <p className="text-sm font-medium text-orange-800">⚠️ Keep your private key secret. Never share it.</p>
              <Input
                label="Enter your password to decrypt"
                type="password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setShowExport(false); setExportPassword(''); }}>Cancel</Button>
                <Button size="sm" onClick={handleExportKey} loading={exporting} disabled={!exportPassword}>Decrypt Key</Button>
              </div>
            </div>
          )
        )}

        {privateKey && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-medium text-red-800">🔑 Your Private Key — store this somewhere safe.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all font-mono text-xs text-red-900">
                {showKey ? privateKey : '•'.repeat(64)}
              </code>
              <button onClick={() => setShowKey((v) => !v)}>
                {showKey ? <EyeOff className="h-4 w-4 text-red-700" /> : <Eye className="h-4 w-4 text-red-700" />}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(privateKey); toast.success('Copied!'); }}>
                <Copy className="h-4 w-4 text-red-700" />
              </button>
            </div>
            <Button size="sm" variant="destructive" onClick={() => { setPrivateKey(''); setShowKey(false); }}>Clear Key from Screen</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
