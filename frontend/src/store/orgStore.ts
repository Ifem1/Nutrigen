import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Database } from '@/types/database';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface OrgState {
  organization: Organization | null;
  isLoading: boolean;

  setOrganization: (org: Organization | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useOrgStore = create<OrgState>()(
  devtools(
    (set) => ({
      organization: null,
      isLoading: false,

      setOrganization: (organization) => set({ organization }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ organization: null, isLoading: false }),
    }),
    { name: 'org-store' }
  )
);
