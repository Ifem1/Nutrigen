'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/store/orgStore';
import { subDays, format } from 'date-fns';

export function useComplianceMetrics(days = 30) {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['compliance-metrics', orgId, days],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const since = subDays(new Date(), days).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('compliance_metrics')
        .select('*')
        .eq('organization_id', orgId!)
        .gte('period_start', since)
        .order('period_start', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRiskBreakdown() {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['risk-breakdown', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('risk_scores')
        .select('risk_level, overall_score, nutritional_risk, cost_risk, welfare_risk, consensus_risk, market_risk')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const counts = { low: 0, medium: 0, high: 0, critical: 0 };
      const sums = { nutritional: 0, cost: 0, welfare: 0, consensus: 0, market: 0 };
      (data ?? []).forEach((r: any) => {
        counts[r.risk_level as keyof typeof counts]++;
        sums.nutritional += Number(r.nutritional_risk ?? 0);
        sums.cost += Number(r.cost_risk ?? 0);
        sums.welfare += Number(r.welfare_risk ?? 0);
        sums.consensus += Number(r.consensus_risk ?? 0);
        sums.market += Number(r.market_risk ?? 0);
      });
      const n = data?.length || 1;
      return {
        distribution: counts,
        averages: {
          nutritional: sums.nutritional / n,
          cost: sums.cost / n,
          welfare: sums.welfare / n,
          consensus: sums.consensus / n,
          market: sums.market / n,
        },
        total: data?.length ?? 0,
      };
    },
  });
}

export function useAuditLogs(page = 1, pageSize = 30) {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['audit-logs', orgId, page],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const from = (page - 1) * pageSize;
      const { data, count, error } = await supabase
        .from('audit_logs')
        .select('*, users(full_name, email)', { count: 'exact' })
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      return { items: data ?? [], total: count ?? 0 };
    },
  });
}

export function useValidatorReputation() {
  return useQuery({
    queryKey: ['validator-reputation'],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('validator_reputation')
        .select('*')
        .order('reputation_score', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}
