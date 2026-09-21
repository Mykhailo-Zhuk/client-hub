/**
 * /api/agent/reply
 *
 * Generates a client-facing reply using the Ollama Cloud model (glm-5.2)
 * given the current project state, recent comments, and a short user prompt.
 *
 * Auth: callers must present the agent_token cookie that matches AGENT_SECRET.
 * Server-to-server callers (e.g. the Telegram webhook) forward the secret as
 * a cookie on the request OR via x-agent-token header.
 *
 * Request body:
 *   {
 *     projectId:  string;                 // required
 *     userMessage: string;                // required -- short hint from Misha
 *     replyTo?:    string;                // optional -- id of the client comment
 *   }
 *
 * Response:
 *   { success, generatedReply, model }
 *
 * NOTE: this endpoint only DRAFTS a reply. The final message is stored via
 * /api/comments POST (same path the admin UI uses) so the existing flow,
 * telegram notifications, and Supabase writes keep working unchanged.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { AGENT_SECRET, AGENT_COOKIE } from '@/lib/agent-auth';

const OLLAMA_ENDPOINT = 'https://ollama.com/v1/chat/completions';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'glm-5.2';

type SupabaseCommentRow = {
  id: string;
  project_id: string;
  type: string;
  message: string;
  author: string;
  timestamp: string;
};

type SupabaseProjectRow = {
  id: string;
  client_name: string;
  client_email: string | null;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  day_current: number;
  day_total: number;
  start_date: string | null;
};

export async function POST(req: NextRequest) {
  try {
    // ---- Auth ----
    // Accept cookie OR `x-agent-token` header (server-to-server callers may
    // not be able to forward cookies through `fetch()` reliably).
    const cookieToken = req.cookies.get(AGENT_COOKIE)?.value;
    const headerToken = req.headers.get('x-agent-token');
    const presented = cookieToken || headerToken;
    if (!AGENT_SECRET || presented !== AGENT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { projectId, userMessage, replyTo } = body || {};

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return NextResponse.json({ error: 'userMessage required' }, { status: 400 });
    }

    // ---- Load project + recent comments from Supabase (falls back to JSON) ----
    const sb = getSupabaseAdmin();
    let project: SupabaseProjectRow | null = null;
    let recent: SupabaseCommentRow[] = [];

    if (sb) {
      const { data: proj } = await sb
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      project = (proj as SupabaseProjectRow) ?? null;

      const { data: comments } = await sb
        .from('comments')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false })
        .limit(10);
      recent = (comments as SupabaseCommentRow[]) ?? [];
    } else {
      // JSON fallback so dev works without Supabase.
      const { getProjectById } = await import('@/lib/projects');
      const { getCommentsByProject } = await import('@/lib/comments');
      const p = getProjectById(projectId);
      if (p) {
        project = {
          id: p.id,
          client_name: p.client,
          client_email: p.clientEmail ?? null,
          title: p.title,
          description: p.description ?? null,
          status: p.status,
          progress: p.progress,
          day_current: p.dayCurrent ?? 0,
          day_total: p.dayTotal ?? 0,
          start_date: p.startDate ?? null,
        } as SupabaseProjectRow;
      }
      recent = (await getCommentsByProject(projectId)) as unknown as SupabaseCommentRow[];
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // ---- Build agent prompt ----
    const conversation = recent
      .map((c) => {
        const ts = (() => {
          try {
            return new Date(c.timestamp).toISOString();
          } catch {
            return c.timestamp;
          }
        })();
        return `**${c.author}** (${ts}, type: ${c.type}):\n${c.message}`;
      })
      .join('\n\n');

    const dayInfo =
      project.day_current && project.day_total
        ? `Day ${project.day_current} / ${project.day_total}`
        : 'n/a';

    const prompt = `# Agent Reply Task

You are an agent helping Misha reply to client messages on the project portal.

## Project Context

- **Title:** ${project.title}
- **Client:** ${project.client_name}${project.client_email ? ` (${project.client_email})` : ''}
- **Progress:** ${project.progress}%
- **Status:** ${project.status}
- **Timeline:** ${dayInfo}

## Recent Conversation (newest first)

${conversation || '_(no prior conversation)_'}

${replyTo ? `\n_Replying to comment id \`${replyTo}\`_\n` : ''}

## User Intent

Misha's short direction: "${userMessage.trim()}"

## Instructions

Generate the **client-facing** reply.
- Address the client's specific question or feedback
- Be honest about progress, blockers, and timelines
- Match the tone of previous Agent messages on this thread
- Use markdown formatting (bold, bullets, links)
- Keep it concise: 2-5 short paragraphs or bullets
- No preamble, no "Sure, here's a reply:", no signatures

## Output

Return ONLY the reply text in markdown.`;

    // ---- Call Ollama Cloud ----
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'OLLAMA_API_KEY not configured. Set it in .env.local or Vercel env to enable AI replies.',
        },
        { status: 503 }
      );
    }

    const ollamaRes = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          {
            role: 'system',
            content:
              'You draft concise, professional, markdown-formatted client updates for a web studio. Never include meta-commentary or signatures.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      console.error('[agent/reply] ollama error', ollamaRes.status, errText);
      return NextResponse.json(
        { error: `Ollama API error: ${ollamaRes.status}`, details: errText.slice(0, 500) },
        { status: 502 }
      );
    }

    const ollamaData = await ollamaRes.json();
    const generatedReply: string =
      ollamaData?.choices?.[0]?.message?.content?.toString()?.trim() ?? '';

    if (!generatedReply) {
      return NextResponse.json(
        { error: 'Ollama returned empty reply', raw: ollamaData },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      generatedReply,
      model: OLLAMA_MODEL,
      projectId,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal error';
    console.error('[agent/reply] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/agent/reply',
    method: 'POST',
    body: { projectId: 'string', userMessage: 'string', replyTo: 'string?' },
    auth: 'cookie agent_token OR x-agent-token header matching AGENT_SECRET',
  });
}
