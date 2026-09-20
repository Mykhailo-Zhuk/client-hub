import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramNotification } from '@/lib/telegram';
import { parseTelegramUpdate } from '@/lib/telegram';

/**
 * Telegram bot webhook.
 *
 * Two roles:
 *  1. Inbound  — receives Telegram update payloads. For MVP we just log
 *                and respond; production would validate X-Telegram-Bot-Api-Secret-Token
 *                header and route /status, /start, /help commands.
 *  2. Outbound — `app/api/telegram POST { project_id, message }` writes
 *                the comment to Supabase AND fires a Telegram message
 *                via the bot token (when configured).
 */
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') ?? '';
    const body = await req.json();

    // ---- Outbound "publish" channel ----
    // Body shape: { project_id: string, message: string }
    if (body.project_id && body.message) {
      const { project_id, message } = body;
      const { getSupabaseAdmin } = await import('@/lib/supabase');
      const sb = getSupabaseAdmin();
      let stored: any = null;

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
          stored = data;
        }

        // Look up project to enrich the TG message.
        const { data: project } = await sb
          .from('projects')
          .select('client_email, title, telegram_chat_id')
          .eq('id', project_id)
          .maybeSingle();

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = (project?.telegram_chat_id as string | undefined) ?? project?.client_email;
        if (botToken && chatId && /^-?\d+$/.test(String(chatId))) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `🔔 New update for "${project?.title ?? project_id}":\n\n${message}`,
            }),
          });
        }
      }

      return NextResponse.json({ ok: true, comment: stored });
    }

    // ---- Inbound webhook (Telegram → us) ----
    if (ct.includes('application/json')) {
      const update = parseTelegramUpdate(body);
      if (update.text?.startsWith('/status')) {
        await sendTelegramNotification(update.from || 'unknown', `📊 Status: ${update.text}`);
      }
      return NextResponse.json({ ok: true, mock: true });
    }

    return NextResponse.json({ ok: true, mock: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mock: true,
    message: 'Telegram bot endpoint — outbound: POST { project_id, message }',
  });
}