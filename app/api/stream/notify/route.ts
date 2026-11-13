import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AGENT_COOKIE, AGENT_SECRET } from '@/lib/agent-auth';
import { getProjectByIdAsync } from '@/lib/projects-db';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const agentToken = (await cookies()).get(AGENT_COOKIE)?.value || authHeader;
  if (agentToken !== AGENT_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const project = await getProjectByIdAsync(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.clientTelegramChatId) {
      return NextResponse.json({
        ok: true,
        notified: false,
        reason: 'no_client_chat_id',
      });
    }

    const text = note
      ? `🔴 Розпочато live-трансляцію роботи над проєктом: ${note}`
      : '🔴 Розпочато live-трансляцію роботи над проєктом! Ви можете переглянути її прямо зараз у кабінеті клієнта.';

    const result = await sendTelegramNotification(projectId, text, {
      recipient: 'client',
      author: 'Developer',
      title: 'Live stream started / Почалась трансляція',
    });

    return NextResponse.json({
      ok: true,
      notified: result.ok && !result.mock,
      reason: result.reason,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send stream notification';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
