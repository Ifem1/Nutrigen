import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { jsonOk, jsonErr, extractErrorMessage } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonErr('Unauthorized', 401);

    // Create policy
    const { data: policy, error: pErr } = await supabase
      .from('policies')
      .insert({
        organization_id: body.org_id,
        name: body.name,
        description: body.description,
        livestock_type: body.livestock_type,
        status: 'draft',
        created_by: user.id,
      })
      .select().single();
    if (pErr) return jsonErr(pErr.message);

    // Insert rules
    if (body.rules?.length) {
      const { error: rErr } = await supabase.from('policy_rules').insert(
        body.rules.map((r: any) => ({ ...r, policy_id: policy.id }))
      );
      if (rErr) return jsonErr(rErr.message);
    }

    // Snapshot version
    await supabase.from('policy_versions').insert({
      policy_id: policy.id, version: 1,
      snapshot: { name: body.name, rules: body.rules },
      change_summary: 'Initial version',
      created_by: user.id,
    });

    // Audit log
    await supabase.from('audit_logs').insert({
      organization_id: body.org_id, actor_id: user.id,
      action: 'policy_created', resource_type: 'policy', resource_id: policy.id,
      details: { name: body.name, livestock_type: body.livestock_type },
    });

    return jsonOk(policy);
  } catch (e) {
    return jsonErr(extractErrorMessage(e), 500);
  }
}
