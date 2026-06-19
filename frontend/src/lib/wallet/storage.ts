// Wallet storage and retrieval via Supabase.
// The encrypted private key is stored server-side; decryption happens
// entirely client-side — the server never sees the plaintext key.

import { getSupabaseClient } from '@/lib/supabase/client';
import { decryptPrivateKey } from './generate';

// ── Store encrypted wallet after signup ──────────────────

export async function storeWallet(
  userId: string,
  address: string,
  encryptedPrivateKey: string,
  salt: string,
  iv: string,
  iterations: number
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('user_wallets').insert({
    user_id: userId,
    address,
    encrypted_private_key: encryptedPrivateKey,
    encryption_salt: salt,
    encryption_iv: iv,
    key_derivation_iterations: iterations,
    is_primary: true,
  });

  if (error) throw new Error(`Failed to store wallet: ${error.message}`);
}

// ── Retrieve encrypted wallet record ────────────────────

export async function getWalletRecord(userId: string) {
  const supabase = getSupabaseClient();

  // Try is_primary first, fall back to any wallet for this user
  const { data: primary } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .limit(1);

  if (primary && primary.length > 0) return primary[0];

  const { data: any_ } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (any_ && any_.length > 0) return any_[0];

  throw new Error('No wallet found for this account. Please generate one from Settings.');
}

// ── Decrypt and return private key (client-side only) ────

export async function unlockWallet(userId: string, password: string): Promise<string> {
  const record = await getWalletRecord(userId);

  const privateKey = await decryptPrivateKey(
    record.encrypted_private_key,
    record.encryption_salt,
    record.encryption_iv,
    password
  );

  // Sanity check: re-derive address from decrypted key
  const { ethers } = await import('ethers');
  const wallet = new ethers.Wallet(privateKey);

  if (wallet.address.toLowerCase() !== record.address.toLowerCase()) {
    throw new Error('Wrong password — wallet address mismatch.');
  }

  return privateKey;
}
