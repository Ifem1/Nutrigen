// Environment variable helpers.
// IMPORTANT: NEXT_PUBLIC_* vars must use static dot-notation access (not bracket notation)
// so Next.js webpack can inline them into the client bundle at build time.

function required(val: string | undefined, key: string): string {
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

// ── Public (browser-safe) ──────────────────────────────────
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  genlayerNetwork: process.env.NEXT_PUBLIC_GENLAYER_NETWORK ?? 'studionet',
  genlayerContractAddress: process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? '0xCf15A810F8a1b687b042a7E56E7774F6ac7dE087',
  genlayerRpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? 'https://studio.genlayer.com/api',
  genlayerChainId: process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? '61999',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const;

// Validate at module load on client — give a clear error if misconfigured
if (typeof window !== 'undefined') {
  required(env.supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL');
  required(env.supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// ── Server-only ────────────────────────────────────────────
export function getServerEnv() {
  return {
    supabaseServiceKey: required(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY'),
    genlayerPrivateKey: process.env.GENLAYER_DEPLOYER_PRIVATE_KEY ?? '',
    genlayerContractAddress: process.env.GENLAYER_CONTRACT_ADDRESS ?? process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? '0xCf15A810F8a1b687b042a7E56E7774F6ac7dE087',
  } as const;
}
