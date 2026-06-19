// Wallet generation and encryption utilities.
// Wallets are generated client-side using ethers.js and encrypted with
// PBKDF2 before being stored in Supabase. The user's password is the
// encryption key — never stored, never sent to the server in plaintext.

import { ethers } from 'ethers';

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  mnemonic: string;
}

export interface EncryptedWallet {
  address: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
  iterations: number;
}

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 256; // bits

// ── Generate a new random wallet ──────────────────────────

export function generateWallet(): GeneratedWallet {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase ?? '',
  };
}

// ── Derive AES-GCM key from password via PBKDF2 ──────────

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt private key with user password ───────────────

export async function encryptPrivateKey(
  privateKey: string,
  password: string
): Promise<{ encryptedPrivateKey: string; salt: string; iv: string; iterations: number }> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(privateKey)
  );

  return {
    encryptedPrivateKey: bufferToHex(encrypted),
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    iterations: PBKDF2_ITERATIONS,
  };
}

// ── Decrypt private key with user password ───────────────

export async function decryptPrivateKey(
  encryptedPrivateKey: string,
  salt: string,
  iv: string,
  password: string
): Promise<string> {
  const saltBytes = hexToBuffer(salt);
  const ivBytes = hexToBuffer(iv);
  const ciphertext = hexToBuffer(encryptedPrivateKey);

  const key = await deriveKey(password, saltBytes);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ── Utils ─────────────────────────────────────────────────

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, 2 + i), 16);
  }
  return bytes;
}

// ── Full flow: generate + encrypt ────────────────────────

export async function createEncryptedWallet(password: string): Promise<{
  wallet: GeneratedWallet;
  encrypted: Awaited<ReturnType<typeof encryptPrivateKey>>;
}> {
  const wallet = generateWallet();
  const encrypted = await encryptPrivateKey(wallet.privateKey, password);
  return { wallet, encrypted };
}
