import { NextRequest, NextResponse } from 'next/server';
import { addCommentAsync } from '@/lib/comments-db';
import { getProjectByIdAsync, getProjectsAsync } from '@/lib/projects-db';
import { sendTelegramNotification } from '@/lib/telegram';
import { AGENT_SECRET } from '@/lib/agent-auth';
import type { CommentType } from '@/lib/types';

const validTypes: CommentType[] = [
  'status_update',
  'milestone',
  'bug_fix',
  'deploy',
  'general',
];

/**
 * POST /api/agent/report
 *
 * Stateless endpoint for the Antigravity MCP server to push work reports
 * from ANY project into client-hub.
 *
 * Auth: Bearer token in Authorization header matching AGENT_SECRET.
 *
 * Body:
 *   {
 *     projectId:  string;          // required — id of the target project
 *     message:    string;          // required — markdown status update
 *     type?:      CommentType;     // defaults to 'status_update'
 *     author?:    string;          // defaults to 'Agent'
 *   }
 */
export async function POST(req: NextRequest) {
  // ---- Auth: Bearer token only (no cookies — headless MCP calls) ----
  const authHeader = req.headers.get('authorization') ?? '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!AGENT_SECRET || bearer !== AGENT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, message, type, author } = body as {
      projectId?: string;
      message?: string;
      type?: string;
      author?: string;
    };

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }
    if (message.trim().length > 5000) {
      return NextResponse.json({ error: 'message too long (max 5000 chars)' }, { status: 400 });
    }

    // Verify project exists
    const project = await getProjectByIdAsync(projectId);
    if (!project) {
      return NextResponse.json({ error: `Project "${projectId}" not found` }, { status: 404 });
    }

    const finalType: CommentType = validTypes.includes(type as CommentType)
      ? (type as CommentType)
      : 'status_update';
    const finalAuthor = (author || 'Agent').toString().trim() || 'Agent';

    const comment = await addCommentAsync({
      projectId,
      type: finalType,
      message: message.trim(),
      author: finalAuthor,
    });

    // Telegram notification
    sendTelegramNotification(projectId, message.trim()).catch(console.error);

    console.log(
      `[agent/report] projectId=${projectId} type=${finalType} author=${finalAuthor}`
    );

    return NextResponse.json({
      ok: true,
      comment,
      projectTitle: project.title,
      projectClient: project.client,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    console.error('[agent/report] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/agent/report
 *
 * Returns the list of active projects (for MCP tool to let the agent
 * pick the right projectId).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!AGENT_SECRET || bearer !== AGENT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = await getProjectsAsync();
    return NextResponse.json({
      ok: true,
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        client: p.client,
        status: p.status,
        progress: p.progress,
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
