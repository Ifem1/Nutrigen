'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/store/orgStore';

export function useOptimizationHistory(page = 1, pageSize = 20, statusFilter?: string) {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['optimization-history', orgId, page, statusFilter],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const from = (page - 1) * pageSize;

      let q = supabase
        .from('optimization_requests')
        .select('*, optimization_results(consensus_status, compliance_score, risk_level), risk_scores(overall_score, risk_level)', { count: 'exact' })
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (statusFilter) q = q.eq('status', statusFilter);

      const { data, count, error } = await q;
      if (error) throw error;
      return { items: data ?? [], total: count ?? 0 };
    },
  });
}

export function useOptimizationResult(requestId: string) {
  return useQuery({
    queryKey: ['optimization-result', requestId],
    enabled: !!requestId,
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.request?.status;
      const pending = ['pending', 'proposing', 'committing', 'revealing'];
      return pending.includes(status) ? 3000 : false;
    },
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const [reqRes, resultRes, validationRes, riskRes, votesRes] = await Promise.all([
        supabase.from('optimization_requests').select('*, policies(name, livestock_type)').eq('id', requestId).single(),
        supabase.from('optimization_results').select('*').eq('request_id', requestId).maybeSingle(),
        supabase.from('validations').select('*, validator_votes(*)').eq('request_id', requestId).maybeSingle(),
        supabase.from('risk_scores').select('*').eq('request_id', requestId).maybeSingle(),
        supabase.from('validator_votes').select('*').eq('request_id', requestId),
      ]);

      return {
        request: reqRes.data,
        result: resultRes.data,
        validation: validationRes.data,
        risk: riskRes.data,
        votes: votesRes.data ?? [],
      };
    },
  });
}
