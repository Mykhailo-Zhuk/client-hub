import { NextRequest, NextResponse } from 'next/server';
import { verifyPortalToken } from '@/lib/jwt';
import { sendTelegramNotification } from '@/lib/telegram';
import { addCommentAsync, getCommentsByProjectAsync, getRecentCommentsAsync } from '@/lib/comments-db';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { CommentType } from '@/lib/types';

const validTypes: CommentType[] = [
  'status_update',
  'milestone',
  'bug_fix',
  'deploy',
  'general',
  'feedback',
  'client_reply',
];

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  try {
    if (projectId) {
      const comments = await getCommentsByProjectAsync(projectId);
      return NextResponse.json({ comments });
    }
    const comments = await getRecentCommentsAsync(50);
    return NextResponse.json({ comments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, type, message, author } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'projectId and message required' },
        { status: 400 }
      );
    }

    const trimmed = String(message).trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }
    if (trimmed.length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 chars)' }, { status: 400 });
    }

    let finalType = (validTypes.includes(type as CommentType) ? type : 'general') as CommentType;
    let finalAuthor = (author || 'Agent').toString().trim() || 'Agent';

    // If a portal session token is presented, treat the comment as a client reply.
    const headerToken =
      req.headers.get('x-portal-token') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const cookieToken = req.cookies.get('ch_session')?.value;
    const token = headerToken || cookieToken;

    if (token) {
      const session = await verifyPortalToken(token);
      if (session && session.projectId === projectId) {
        finalType = 'client_reply';
        finalAuthor = session.email;
      } else if (session && session.projectId !== projectId) {
        return NextResponse.json({ error: 'Token does not match project' }, { status: 403 });
      }
    }

    const comment = await addCommentAsync({
      projectId,
      type: finalType,
      message: trimmed,
      author: finalAuthor,
    });

    const usedSupabase = isSupabaseConfigured();
    console.log(
      `[comments] stored projectId=${projectId} type=${finalType} author=${finalAuthor} backend=${usedSupabase ? 'supabase' : 'json'}`
    );

    // Telegram notification — only for agent (non-client) messages.
    if (finalType !== 'client_reply') {
      sendTelegramNotification(projectId, trimmed).catch(console.error);
    }

    return NextResponse.json({ ok: true, comment, backend: usedSupabase ? 'supabase' : 'json' });
  } catch (e: any) {
    console.error('[comments] POST error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}