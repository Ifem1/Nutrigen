'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/store/orgStore';

export function useTeamMembers() {
  const { organization } = useOrgStore();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['team-members', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('users').update({ role }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Role updated.'); qc.invalidateQueries({ queryKey: ['team-members'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  const { setOrganization } = useOrgStore();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const supabase = getSupabaseClient();
      const { data: org, error } = await supabase.from('organizations').update(data).eq('id', id).select().single();
      if (error) throw error;
      return org;
    },
    onSuccess: (org) => {
      toast.success('Organization updated.');
      setOrganization(org);
      qc.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
