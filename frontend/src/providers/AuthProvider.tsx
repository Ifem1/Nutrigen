'use client';

import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useOrgStore } from '@/store/orgStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setWalletAddress, setLoading, setInitialized } =
    useAuthStore();
  const { setOrganization } = useOrgStore();

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function loadUserData(userId: string) {
      const [profileResult, walletResult] = await Promise.all([
        supabase
          .from('users')
          .select('*, organizations(*)')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_wallets')
          .select('address')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .single(),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data);
        if (profileResult.data.organizations) {
          setOrganization(profileResult.data.organizations as never);
        }
      }

      if (walletResult.data) {
        setWalletAddress(walletResult.data.address);
      }
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserData(session.user.id).finally(() => {
          setLoading(false);
          setInitialized(true);
        });
      } else {
        setLoading(false);
        setInitialized(true);
      }
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
          setOrganization(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setProfile, setWalletAddress, setLoading, setInitialized, setOrganization]);

  return <>{children}</>;
}
