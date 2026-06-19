'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { createEncryptedWallet } from '@/lib/wallet/generate';
import { storeWallet } from '@/lib/wallet/storage';
import { useAuthStore } from '@/store/authStore';
import { useOrgStore } from '@/store/orgStore';

export function useAuth() {
  const router = useRouter();
  const { user, session, profile, walletAddress, isLoading, isInitialized, reset } = useAuthStore();
  const { reset: resetOrg } = useOrgStore();

  // ── Sign Up ─────────────────────────────────────────────

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed — no user returned.');

      // Generate wallet encrypted with the user's password
      const { wallet, encrypted } = await createEncryptedWallet(password);

      await storeWallet(
        data.user.id,
        wallet.address,
        encrypted.encryptedPrivateKey,
        encrypted.salt,
        encrypted.iv,
        encrypted.iterations
      );

      return { user: data.user, walletAddress: wallet.address };
    },
    []
  );

  // ── Sign In ─────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  // ── Sign Out ────────────────────────────────────────────

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    reset();
    resetOrg();
    router.push('/login');
  }, [router, reset, resetOrg]);

  // ── Forgot Password ─────────────────────────────────────

  const sendPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  // ── Reset Password ──────────────────────────────────────

  const resetPassword = useCallback(async (newPassword: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  return {
    user,
    session,
    profile,
    walletAddress,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    resetPassword,
  };
}
