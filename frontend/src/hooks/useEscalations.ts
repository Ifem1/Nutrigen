'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/store/orgStore';

export function useEscalations(statusFilter?: string) {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['escalations', orgId, statusFilter],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      let q = supabase
        .from('escalations')
        .select('*, optimization_requests(livestock_type, breed, herd_size, status), users(full_name)')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEscalation(id: string) {
  return useQuery({
    queryKey: ['escalation', id],
    enabled: !!id,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('escalations')
        .select('*, optimization_requests(*), optimization_results(*), escalation_responses(*, users(full_name, email))')
        .eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useResolveEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ escalationId, decision, notes }: { escalationId: string; decision: string; notes?: string }) => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('escalation_responses').insert({
        escalation_id: escalationId, reviewer_id: user.id, decision, notes,
      });

      const statusMap: Record<string, string> = {
        approve: 'approved', reject: 'rejected',
        modify: 'in_review', re_evaluate: 'in_review',
      };

      await supabase.from('escalations').update({
        status: statusMap[decision] ?? 'in_review',
        resolved_at: ['approve', 'reject'].includes(decision) ? new Date().toISOString() : null,
      }).eq('id', escalationId);
    },
    onSuccess: () => {
      toast.success('Escalation resolved.');
      qc.invalidateQueries({ queryKey: ['escalations'] });
      qc.invalidateQueries({ queryKey: ['escalation'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
