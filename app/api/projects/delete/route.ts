import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { deleteProject } from '@/lib/projects-db';

const AGENT_SECRET =
  process.env.AGENT_PASSWORD || process.env.AGENT_SECRET || 'dev-agent-secret';

/**
 * Delete a project (and cascade its comments). Gated by the `agent_token`
 * cookie — same gate as /admin and /api/projects/update.
 */
export async function POST(req: NextRequest) {
  const agentToken = cookies().get('agent_token')?.value;
  if (agentToken !== AGENT_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase not configured — cannot delete projects.' },
      { status: 503 }
    );
  }

  try {
    const { projectId } = await req.json();
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    // sanity check — make sure the client is real (requireSupabaseAdmin would also throw)
    requireSupabaseAdmin();
    await deleteProject(projectId);
    return NextResponse.json({ ok: true, projectId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}