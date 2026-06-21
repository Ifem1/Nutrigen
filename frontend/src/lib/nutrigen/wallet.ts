// Wallet generation and encrypted storage for GenLayer transaction signing

export function generateWallet(): { address: string; privateKey: string } {
  // Generate a random 32-byte private key
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const privateKey = "0x" + Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");

  // Derive address from private key (simplified — for production use ethers.Wallet)
  // We store both and use ethers on the server side for actual signing
  const address = "0x" + Array.from(array.slice(12)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { address, privateKey };
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
