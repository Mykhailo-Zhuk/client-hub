// Telegram bot helper.
//
// Supports delivering notifications to:
// 1. Admin/Developer (per-project telegram_bot_token / telegram_chat_id or env fallback)
// 2. Client (per-project client_telegram_token / client_telegram_chat_id or fallback)
// 3. Or both ('all')
//
// Falls back to a clean console log mock if tokens or chat IDs are not configured.

import { getProjectByIdAsync } from './projects-db';

export interface TelegramNotificationOptions {
  recipient?: 'admin' | 'client' | 'all';
  title?: string;
  author?: string;
}

export interface TelegramResult {
  ok: boolean;
  mock: boolean;
  sentTo?: string[];
  reason?: string;
}

const DEFAULT_BASE_URL = 'https://client-hub-inky-one.vercel.app';

async function sendToTelegramApi(
  botToken: string,
  chatId: string,
  text: string
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; description?: string }
      | null;
    if (!res.ok || !body?.ok) {
      const err = body?.description ?? `http ${res.status}`;
      console.error(`[telegram] sendMessage failed chat=${chatId}: ${err}`);
      return { ok: false, reason: err };
    }
    return { ok: true };
  } catch (e) {
    const err = (e as Error).message;
    console.error(`[telegram] sendMessage network exception: ${err}`);
    return { ok: false, reason: err };
  }
}

export async function sendTelegramNotification(
  projectId: string,
  message: string,
  options?: TelegramNotificationOptions
): Promise<TelegramResult> {
  const recipient = options?.recipient || 'all';
  const title = options?.title || 'Сповіщення';
  const author = options?.author;

  let project = null;
  try {
    project = await getProjectByIdAsync(projectId);
  } catch (err) {
    console.warn(`[telegram] error fetching project ${projectId}:`, err);
  }

  const projectTitle = project?.title || projectId;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL;

  // Resolve Admin credentials
  const adminBotToken = project?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = project?.telegramChatId || process.env.TELEGRAM_CHAT_ID;

  // Resolve Client credentials
  const clientBotToken =
    project?.clientTelegramToken || project?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const clientChatId = project?.clientTelegramChatId;

  const targets: Array<{
    role: 'admin' | 'client';
    botToken?: string;
    chatId?: string;
    link: string;
  }> = [];

  if (recipient === 'admin' || recipient === 'all') {
    targets.push({
      role: 'admin',
      botToken: adminBotToken,
      chatId: adminChatId,
      link: `${baseUrl}/admin/${projectId}`,
    });
  }

  if (recipient === 'client' || recipient === 'all') {
    targets.push({
      role: 'client',
      botToken: clientBotToken,
      chatId: clientChatId,
      link: `${baseUrl}/portal/${projectId}`,
    });
  }

  const sentTo: string[] = [];
  let atLeastOneSent = false;
  let allMocked = true;

  for (const target of targets) {
    const preview = `${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
    const authorLine = author ? `👤 Від: ${author}\n` : '';
    const text = `🔔 Client Hub | ${title}\n📁 Проєкт: ${projectTitle}\n${authorLine}\n💬 Повідомлення:\n${message}\n\n🌐 Посилання: ${target.link}`;

    if (!target.botToken || !target.chatId) {
      console.log(
        `📨 Telegram(mock for ${target.role}): [${projectId}] ${preview} (missing token or chatId)`
      );
      continue;
    }

    allMocked = false;
    const sendRes = await sendToTelegramApi(target.botToken, target.chatId, text);
    if (sendRes.ok) {
      atLeastOneSent = true;
      sentTo.push(`${target.role}:${target.chatId}`);
      console.log(`📨 Telegram(sent to ${target.role}): [${projectId}] → ${target.chatId}`);
    }
  }

  if (allMocked) {
    return {
      ok: true,
      mock: true,
      reason: 'no configured telegram credentials for recipient target(s)',
    };
  }

  return {
    ok: atLeastOneSent,
    mock: false,
    sentTo,
  };
}

export function parseTelegramUpdate(body: any): {
  chat_id?: string;
  text?: string;
  from?: string;
} {
  return {
    chat_id: body?.message?.chat?.id,
    text: body?.message?.text,
    from: body?.message?.from?.username,
  };
}
