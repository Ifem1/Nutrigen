import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { request_id, org_id, result_id, reason, triggered_by, priority } = await req.json();

    // Avoid duplicate escalations
    const { data: existing } = await supabase
      .from('escalations')
      .select('id')
      .eq('request_id', request_id)
      .maybeSingle();

    if (existing) return new Response(JSON.stringify({ success: true, already_exists: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: escalation, error } = await supabase.from('escalations').insert({
      organization_id: org_id, request_id, result_id: result_id ?? null,
      reason, triggered_by, priority: priority ?? 'medium', status: 'pending',
    }).select().single();

    if (error) throw error;

    // Notify org admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', org_id)
      .in('role', ['owner', 'admin', 'manager']);

    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map((a: any) => ({
          user_id: a.id, organization_id: org_id,
          title: 'New Escalation Requires Review',
          message: reason,
          type: 'escalation',
          resource_type: 'escalation',
          resource_id: escalation.id,
        }))
      );
    }

    return new Response(JSON.stringify({ success: true, escalation_id: escalation.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
