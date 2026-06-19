'use client';

import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setWalletAddress, setLoading, setInitialized } =
    useAuthStore();

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function loadUserData(userId: string) {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (profile) setProfile(profile);

        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('address')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .single();
        if (wallet) setWalletAddress(wallet.address);
      } catch {
        // Tables may not exist yet — not fatal, user is still authenticated
      }
    }

    // Initial session check — always call setInitialized(true) no matter what
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user.id);
      }
    }).catch(() => {
      // Network error — still mark initialized so UI doesn't spin forever
    }).finally(() => {
      setLoading(false);
      setInitialized(true);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setProfile(null);
          setWalletAddress(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setProfile, setWalletAddress, setLoading, setInitialized]);

  return <>{children}</>;
}
