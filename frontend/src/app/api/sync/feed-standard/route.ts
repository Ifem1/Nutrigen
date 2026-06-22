import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data: existing } = await supabase
      .from('feed_standard_versions')
      .select('id')
      .eq('farm_id', body.farm_id)
      .eq('standard_id', body.standard_id)
      .eq('version', body.version)
      .maybeSingle();

    let error;
    if (existing?.id) {
      ({ error } = await supabase.from('feed_standard_versions').update(body).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('feed_standard_versions').insert(body));
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
