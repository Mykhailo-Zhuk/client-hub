import { NextRequest, NextResponse } from 'next/server';
import { syncProjectsToSupabase } from '@/lib/projects-db';
import { syncCommentsToSupabase } from '@/lib/comments-db';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Supabase is not configured' },
      { status: 400 }
    );
  }

  try {
    const sb = getSupabaseAdmin();
    if (sb) {
      // Clean up legacy placeholder comments for iron-master
      await sb
        .from('comments')
        .delete()
        .eq('project_id', 'iron-master')
        .not('message', 'like', '### %');
    }

    const [pRes, cRes] = await Promise.all([
      syncProjectsToSupabase(),
      syncCommentsToSupabase(),
    ]);

    return NextResponse.json({
      ok: true,
      projectsSynced: pRes.synced,
      commentsSynced: cRes.synced,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
