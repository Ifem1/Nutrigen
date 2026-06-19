// Environment variable validation — throws at startup if required vars are missing.
// This catches misconfiguration before any user hits a cryptic runtime error.

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

// ── Public (browser-safe) ──────────────────────────────────
export const env = {
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  genlayerNetwork: optionalEnv('NEXT_PUBLIC_GENLAYER_NETWORK', 'studionet'),
  genlayerContractAddress: optionalEnv('NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS'),
  appUrl: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
} as const;

// ── Server-only ────────────────────────────────────────────
// Import these only inside server components / edge functions
export function getServerEnv() {
  return {
    supabaseServiceKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    genlayerPrivateKey: optionalEnv('GENLAYER_DEPLOYER_PRIVATE_KEY'),
    genlayerContractAddress: optionalEnv('GENLAYER_CONTRACT_ADDRESS', optionalEnv('NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS')),
  } as const;
}
