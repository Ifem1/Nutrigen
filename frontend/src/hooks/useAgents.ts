'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/store/orgStore';

export function useAgents() {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['agents', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agent', id],
    enabled: !!id,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('agents').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  const { organization } = useOrgStore();

  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; agent_type?: string; capabilities?: string[] }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('agents')
        .insert({ ...payload, organization_id: organization!.id, agent_type: payload.agent_type ?? 'feed_optimizer', status: 'active' })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('Agent registered.'); qc.invalidateQueries({ queryKey: ['agents'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAgentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' | 'suspended' }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('agents').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Agent updated.'); qc.invalidateQueries({ queryKey: ['agents'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
