import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireSupabaseAdmin } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

const AGENT_SECRET = process.env.AGENT_PASSWORD || process.env.AGENT_SECRET || 'dev-agent-secret';

/**
 * PATCH/POST endpoint for updating project state from the admin panel.
 * Gated by the agent_token cookie (same as /admin/layout).
 */
export async function POST(req: NextRequest) {
  const agentToken = (await cookies()).get('agent_token')?.value;
  if (agentToken !== AGENT_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          'Supabase not configured — cannot persist project updates. The admin UI will still read from JSON fallback.',
      },
      { status: 503 }
    );
  }

  try {
    const { projectId, progress, status } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    const sb = requireSupabaseAdmin();
    const updates: Record<string, unknown> = {};
    if (typeof progress === 'number') updates.progress = progress;
    if (['active', 'completed', 'paused'].includes(status)) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'no updates provided' }, { status: 400 });
    }

    const { error } = await sb.from('projects').update(updates).eq('id', projectId);
    if (error) throw error;

    return NextResponse.json({ ok: true, projectId, updates });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}