'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/store/orgStore';

export function usePolicies(livestockType?: string) {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['policies', orgId, livestockType],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      let q = supabase
        .from('policies')
        .select('*, policy_rules(count)')
        .eq('organization_id', orgId!)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false });
      if (livestockType) q = q.eq('livestock_type', livestockType);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePolicy(id: string) {
  return useQuery({
    queryKey: ['policy', id],
    enabled: !!id,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('policies')
        .select('*, policy_rules(*), policy_versions(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  const { organization } = useOrgStore();

  return useMutation({
    mutationFn: async (payload: {
      name: string; description?: string; livestock_type: string;
      rules: { rule_name: string; rule_category: string; parameter: string;
        min_value?: number; max_value?: number; unit?: string;
        tolerance_percent?: number; is_mandatory?: boolean; description?: string }[];
    }) => {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, org_id: organization?.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create policy');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Policy created.');
      qc.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePolicyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'draft' | 'archived' }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('policies').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Policy updated.');
      qc.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
