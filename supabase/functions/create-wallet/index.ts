// Supabase Edge Function: create-wallet
// Triggered as a webhook on auth.users INSERT (configured in Supabase Dashboard).
// Logs the wallet creation event to audit_logs.
// The actual wallet is generated client-side and stored by the frontend;
// this function handles server-side audit logging only.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { user_id, wallet_address, org_id } = body;

    if (!user_id || !wallet_address) {
      return new Response(
        JSON.stringify({ error: 'user_id and wallet_address are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Write audit log
    if (org_id) {
      await supabase.from('audit_logs').insert({
        organization_id: org_id,
        actor_id: user_id,
        action: 'wallet_created',
        resource_type: 'user_wallet',
        details: { wallet_address, method: 'auto_generated_on_signup' },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
