import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { request_id, org_id, result } = await req.json();

    const nutritionalRisk = result.crude_protein_percent ? Math.max(0, 100 - result.crude_protein_percent * 4) : 50;
    const costRisk = result.total_daily_cost_per_head && result.budget_per_head_per_day
      ? Math.max(0, Math.min(100, ((result.total_daily_cost_per_head - result.budget_per_head_per_day) / result.budget_per_head_per_day) * 100))
      : 30;
    const welfareRisk = result.welfare_score ? Math.max(0, (10 - result.welfare_score) * 10) : 40;
    const consensusRisk = result.agreement_percentage ? Math.max(0, 100 - result.agreement_percentage) : 50;
    const marketRisk = 20;

    const overall = nutritionalRisk * 0.30 + costRisk * 0.25 + welfareRisk * 0.20 + consensusRisk * 0.15 + marketRisk * 0.10;
    const riskLevel = overall < 30 ? 'low' : overall < 60 ? 'medium' : overall < 80 ? 'high' : 'critical';

    await supabase.from('risk_scores').upsert({
      request_id, organization_id: org_id,
      overall_score: overall, risk_level: riskLevel,
      nutritional_risk: nutritionalRisk, cost_risk: costRisk,
      welfare_risk: welfareRisk, consensus_risk: consensusRisk, market_risk: marketRisk,
    }, { onConflict: 'request_id' });

    return new Response(JSON.stringify({ success: true, risk_level: riskLevel, overall_score: overall }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
