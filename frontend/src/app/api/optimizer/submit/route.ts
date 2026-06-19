import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { jsonOk, jsonErr, extractErrorMessage } from '@/lib/api/response';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return jsonErr('Unauthorized', 401);

    const requestId = randomUUID();

    // Store the optimization request in Supabase
    const { error: insertErr } = await supabase.from('optimization_requests').insert({
      id: requestId,
      organization_id: body.org_id,
      policy_id: body.policy_id,
      requested_by: user.id,
      status: 'pending',
      livestock_type: body.livestock_type,
      breed: body.breed,
      herd_size: body.herd_size,
      avg_weight_kg: body.avg_weight_kg,
      target_weight_kg: body.target_weight_kg,
      growth_stage: body.growth_stage,
      location_country: body.location_country,
      location_region: body.location_region,
      temperature_celsius: body.temperature_celsius,
      humidity_percent: body.humidity_percent,
      season: body.season,
      weather_conditions: body.weather_conditions,
      available_forages: body.available_forages ?? [],
      forage_quality_score: body.forage_quality_score,
      budget_per_head_per_day: body.budget_per_head_per_day,
      currency: body.currency,
      max_feed_cost_per_kg: body.max_feed_cost_per_kg,
    });

    if (insertErr) return jsonErr(insertErr.message);

    // Trigger the optimizer edge function asynchronously
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    fetch(`${supabaseUrl}/functions/v1/run-feed-optimizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
      body: JSON.stringify({ request_id: requestId, ...body }),
    }).catch(() => {}); // fire-and-forget

    return jsonOk({ request_id: requestId });
  } catch (e) {
    return jsonErr(extractErrorMessage(e), 500);
  }
}
