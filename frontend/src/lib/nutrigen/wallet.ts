// Wallet generation and storage for GenLayer transaction signing
import { generatePrivateKey, createAccount } from "genlayer-js";

export function generateWallet(): { address: string; privateKey: string } {
  const privateKey = generatePrivateKey();
  const account = createAccount(privateKey);
  return { address: account.address, privateKey };
}

const STORAGE_KEY = "nutrigen_wallet";

export function storeWallet(wallet: { address: string; privateKey: string }) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
}

export function getStoredWallet(): { address: string; privateKey: string } | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearWallet() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
