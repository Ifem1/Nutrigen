'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setWalletAddress, setLoading, setInitialized } =
    useAuthStore();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    (async () => {
      try {
        const { getSupabaseClient } = await import('@/lib/supabase/client');
        const supabase = getSupabaseClient();

        // Load session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profile) setProfile(profile);
          } catch {}

          try {
            const { data: wallet } = await supabase
              .from('user_wallets')
              .select('address')
              .eq('user_id', session.user.id)
              .eq('is_primary', true)
              .single();
            if (wallet) setWalletAddress(wallet.address);
          } catch {}
        }

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          if (!session?.user) {
            setProfile(null);
            setWalletAddress(null);
          }
        });
        subscription = data.subscription;
      } catch (err) {
        console.error('AuthProvider init error:', err);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    })();

    return () => {
      subscription?.unsubscribe();
    };
  }, [setUser, setSession, setProfile, setWalletAddress, setLoading, setInitialized]);

  return <>{children}</>;
}
