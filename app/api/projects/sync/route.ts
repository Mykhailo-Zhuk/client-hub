import { NextRequest, NextResponse } from 'next/server';
import { syncProjectsToSupabase } from '@/lib/projects-db';
import { syncCommentsToSupabase } from '@/lib/comments-db';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Supabase is not configured' },
      { status: 400 }
    );
  }

  try {
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
