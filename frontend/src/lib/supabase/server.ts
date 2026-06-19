import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { env } from '@/lib/env';

// Server-side Supabase client — reads session from cookies.
// Use inside Server Components, Route Handlers, and Middleware.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // In Server Components the cookie store is read-only.
          // Session refresh happens in middleware instead.
        }
      },
    },
  });
}
