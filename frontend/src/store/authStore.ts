import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  walletAddress: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setWalletAddress: (address: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  walletAddress: null,
  isLoading: true,
  isInitialized: false,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      reset: () => set(initialState),
    }),
    { name: 'auth-store' }
  )
);
