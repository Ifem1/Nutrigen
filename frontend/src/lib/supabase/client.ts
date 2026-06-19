import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient() {
  return createBrowserClient<any>(env.supabaseUrl, env.supabaseAnonKey);
}

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_client) _client = createClient();
  return _client;
}
