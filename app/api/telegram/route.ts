import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

/**
 * Telegram bot webhook.
 *
 * Inbound handles Misha's commands:
 *   /projects        — list active projects with progress + IDs
 *   /reply <id> <msg>— draft a client reply via /api/agent/reply,
 *                      then offer inline [Send to Client] / [Edit] buttons
 *   /start, /help    — quick help
 *
 * Callback queries on `send:<id>:<msg>` insert the comment into Supabase
 * and confirm via answerCallbackQuery.
 *
 * Outbound (existing): POST { project_id, message } writes a comment
 * AND notifies any chat associated with the project.
 */

async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  extra: Record<string, unknown> = {}
) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log(`📨 Telegram(mock): [${chatId}] ${text.slice(0, 80)}…`);
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...extra,
    }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    }
  );
}

async function handleProjects(chatId: number | string) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    await sendTelegramMessage(chatId, '❌ Supabase not configured');
    return;
  }

  const { data: projects, error } = await sb
    .from('projects')
    .select('id, title, client_name, progress, status')
    .eq('status', 'active');

  if (error) {
    await sendTelegramMessage(chatId, `❌ DB error: ${error.message}`);
    return;
  }

  let text = '📋 *Active Projects*\n\n';
  if (!projects || projects.length === 0) {
    text += '_No active projects._';
  } else {
    for (const p of projects) {
      text += `• *${p.title}*\n`;
      text += `  Client: ${p.client_name ?? '—'}\n`;
      text += `  Progress: ${p.progress ?? 0}%\n`;
      text += `  ID: \`${p.id}\`\n\n`;
    }
    text += '\n💡 Reply: `/reply <project_id> <your message>`';
  }

  await sendTelegramMessage(chatId, text);
}

async function handleReply(
  chatId: number | string,
  fullText: string,
  origin: string
) {
  const parts = fullText.split(' ');
  const projectId = parts[1];
  const userMessage = parts.slice(2).join(' ');

  if (!projectId || !userMessage) {
    await sendTelegramMessage(
      chatId,
      '❌ Usage: `/reply <project_id> <message>`'
    );
    return;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://client-hub-inky-one.vercel.app';

  // Forward origin (chat id) as a cookie-style marker is impossible across
  // server fetch — instead we just rely on AGENT_SECRET in the header.
  const agentSecret =
    process.env.AGENT_SECRET || process.env.AGENT_TOKEN_SECRET || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (agentSecret) headers['x-agent-token'] = agentSecret;
  if (origin) headers['x-tg-chat-id'] = String(origin);

  let agentRes: Response;
  try {
    agentRes = await fetch(`${appUrl}/api/agent/reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, userMessage }),
    });
  } catch (e) {
    await sendTelegramMessage(
      chatId,
      `❌ Agent unreachable: ${(e as Error).message}`
    );
    return;
  }

  if (!agentRes.ok) {
    await sendTelegramMessage(chatId, `❌ Agent error: ${agentRes.status}`);
    return;
  }

  const agentData = await agentRes.json();
  const generated: string = agentData?.generatedReply ?? '';
  if (!generated) {
    await sendTelegramMessage(chatId, '❌ Agent returned empty reply');
    return;
  }

  await sendTelegramMessage(
    chatId,
    `🤖 *Agent Reply for* \`${projectId}\`\n\n${generated}\n\n_Send to client?_`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Send to Client',
              callback_data: `send:${projectId}:${encodeURIComponent(generated)}`,
            },
            { text: '✏️ Edit', callback_data: `edit:${projectId}` },
          ],
        ],
      },
    }
  );
}

async function handleCallbackQuery(cb: {
  id: string;
  data?: string;
  message?: { chat?: { id?: number | string } };
}) {
  const chatId = cb.message?.chat?.id;
  const data = cb.data || '';

  if (data.startsWith('send:')) {
    // Format: send:<projectId>:<encoded message>
    const firstColon = data.indexOf(':');
    const secondColon = data.indexOf(':', firstColon + 1);
    if (firstColon < 0 || secondColon < 0) {
      await answerCallback(cb.id, '❌ Bad callback payload');
      return;
    }
    const projectId = data.substring(firstColon + 1, secondColon);
    const encoded = data.substring(secondColon + 1);
    const message = decodeURIComponent(encoded);

    const sb = getSupabaseAdmin();
    if (!sb) {
      await answerCallback(cb.id, '❌ Supabase not configured');
      return;
    }

    const { error } = await sb.from('comments').insert({
      project_id: projectId,
      message,
      author: 'Agent (AI)',
      type: 'update',
    });

    if (error) {
      await answerCallback(cb.id, `❌ DB error: ${error.message}`);
      return;
    }
    await answerCallback(cb.id, '✅ Sent to client');
    if (chatId !== undefined) {
      await sendTelegramMessage(
        chatId,
        `✅ Posted to *${projectId}*: "${message.slice(0, 120)}${
          message.length > 120 ? '…' : ''
        }"`
      );
    }
    return;
  }

  if (data.startsWith('edit:')) {
    await answerCallback(
      cb.id,
      'Open the portal project page to edit before sending.'
    );
    if (chatId !== undefined) {
      const projectId = data.substring('edit:'.length);
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://client-hub-inky-one.vercel.app';
      await sendTelegramMessage(
        chatId,
        `✏️ Edit in portal: ${appUrl}/admin/${projectId}`
      );
    }
    return;
  }

  await answerCallback(cb.id, 'Unknown action');
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') ?? '';
    const body = await req.json().catch(() => ({}));

    // ---- Outbound "publish" channel ----
    // Body shape: { project_id: string, message: string }
    if (body.project_id && body.message && !body.message?.text) {
      const { project_id, message } = body;
      const sb = getSupabaseAdmin();
      let stored: Record<string, unknown> | null = null;
      let tgInfo: Record<string, unknown> | null = null;

      if (sb) {
        const { data, error } = await sb
          .from('comments')
          .insert({
            project_id,
            message,
            author: 'Agent',
            type: 'update',
          })
          .select()
          .single();
        if (error) {
          console.error('[telegram/outbound] supabase insert failed:', error.message);
        } else {
          stored = data as Record<string, unknown>;
        }

        const { data: project } = await sb
          .from('projects')
          .select('client_email, title, telegram_chat_id')
          .eq('id', project_id)
          .maybeSingle();

        tgInfo = await sendDirectNotification(
          project?.telegram_chat_id as string | undefined,
          project?.client_email as string | undefined,
          project?.title as string | undefined,
          project_id,
          message
        );
      }

      return NextResponse.json({ ok: true, comment: stored, tg: tgInfo });
    }

    // ---- Inbound webhook (Telegram → us) ----
    if (ct.includes('application/json')) {
      // Callback query button press
      if (body.callback_query) {
        await handleCallbackQuery(body.callback_query);
        return NextResponse.json({ ok: true });
      }

      // Plain message commands
      const text: string = body?.message?.text ?? '';
      const chatId: number | string | undefined = body?.message?.chat?.id;

      if (chatId === undefined) {
        return NextResponse.json({ ok: true, ignored: true });
      }

      if (text === '/projects' || text.startsWith('/projects ')) {
        await handleProjects(chatId);
        return NextResponse.json({ ok: true });
      }

      if (text.startsWith('/reply ')) {
        await handleReply(chatId, text, body?.message?.chat?.id);
        return NextResponse.json({ ok: true });
      }

      if (text === '/start' || text === '/help') {
        await sendTelegramMessage(
          chatId,
          [
            '👋 *Client Hub Bot*',
            '',
            'Commands:',
            '• `/projects` — list active projects',
            '• `/reply <project_id> <hint>` — draft an AI reply for a client',
            '',
            '_All project updates you send here are mirrored to the admin portal._',
          ].join('\n')
        );
        return NextResponse.json({ ok: true });
      }

      // Unknown inbound — keep quiet
      return NextResponse.json({ ok: true, ignored: true });
    }

    return NextResponse.json({ ok: true, mock: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    console.error('[telegram] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function sendDirectNotification(
  projectChatId: string | undefined,
  projectClientEmail: string | undefined,
  projectTitle: string | undefined,
  projectId: string,
  message: string
): Promise<Record<string, unknown> | null> {
  if (!TELEGRAM_BOT_TOKEN) return null;
  const chatId =
    (projectChatId && /^-?\d+$/.test(projectChatId) ? projectChatId : undefined) ??
    (projectClientEmail && /^-?\d+$/.test(projectClientEmail)
      ? projectClientEmail
      : undefined);
  if (!chatId) return null;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🔔 New update for "${projectTitle ?? projectId}":\n\n${message}`,
    }),
  });
  return { chat_id: chatId };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mock: true,
    message:
      'Telegram bot endpoint. Inbound: Telegram webhook with /projects, /reply, /start. Outbound: POST { project_id, message }.',
  });
}
