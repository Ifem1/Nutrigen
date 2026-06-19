import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { jsonOk, jsonErr, extractErrorMessage } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get('requestId');
    if (!requestId) return jsonErr('requestId is required', 400);

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonErr('Unauthorized', 401);

    const [reqResult, resultResult] = await Promise.all([
      supabase.from('optimization_requests').select('status, tx_hash').eq('id', requestId).single(),
      supabase.from('optimization_results').select('consensus_status, compliance_score, risk_score, risk_level').eq('request_id', requestId).maybeSingle(),
    ]);

    return jsonOk({
      status: reqResult.data?.status,
      tx_hash: reqResult.data?.tx_hash,
      consensus_status: resultResult.data?.consensus_status,
      compliance_score: resultResult.data?.compliance_score,
      risk_score: resultResult.data?.risk_score,
      risk_level: resultResult.data?.risk_level,
    });
  } catch (e) {
    return jsonErr(extractErrorMessage(e), 500);
  }
}
