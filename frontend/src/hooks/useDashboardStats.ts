'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/store/orgStore';
import type { DashboardStats } from '@/types';

export function useDashboardStats() {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();

      const [reqResult, riskResult, escResult, agentResult] = await Promise.all([
        supabase
          .from('optimization_requests')
          .select('status', { count: 'exact' })
          .eq('organization_id', orgId!),
        supabase
          .from('risk_scores')
          .select('overall_score')
          .eq('organization_id', orgId!),
        supabase
          .from('escalations')
          .select('id', { count: 'exact' })
          .eq('organization_id', orgId!)
          .eq('status', 'pending'),
        supabase
          .from('agents')
          .select('id', { count: 'exact' })
          .eq('organization_id', orgId!)
          .eq('status', 'active'),
      ]);

      const requests = reqResult.data ?? [];
      const total = requests.length;
      const accepted = requests.filter((r) => r.status === 'accepted' || r.status === 'finalized').length;
      const complianceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

      const riskScores = riskResult.data ?? [];
      const avgRisk = riskScores.length
        ? riskScores.reduce((s, r) => s + Number(r.overall_score), 0) / riskScores.length
        : 0;

      return {
        total_optimizations: total,
        compliance_rate: complianceRate,
        avg_risk_score: Math.round(avgRisk),
        active_agents: agentResult.count ?? 0,
        pending_escalations: escResult.count ?? 0,
        cost_savings: 0,
      };
    },
  });
}

export function useRecentOptimizations(limit = 8) {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['recent-optimizations', orgId, limit],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('optimization_requests')
        .select('id, livestock_type, breed, status, created_at, optimization_results(consensus_status, compliance_score)')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}
