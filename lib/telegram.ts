// Telegram bot helper.
//
// When TELEGRAM_BOT_TOKEN is configured AND a chat id is available
// (either per-project telegram_chat_id column, or fallback env var),
// this calls the real Bot API `sendMessage`. Otherwise it falls back
// to a console-only "mock" so dev never breaks.

export async function sendTelegramNotification(
  projectId: string,
  message: string
): Promise<{ ok: boolean; mock: boolean; chat_id?: string; reason?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const fallbackChatId = process.env.TELEGRAM_CHAT_ID;

  const preview = `${message.substring(0, 80)}${
    message.length > 80 ? "..." : ""
  }`;

  if (!botToken) {
    console.log(`📨 Telegram(mock): [${projectId}] ${preview}`);
    return { ok: true, mock: true, reason: "no TELEGRAM_BOT_TOKEN" };
  }

  // Resolve chat id: try per-project column, then env fallback.
  let chatId: string | undefined;
  try {
    const { getSupabaseAdmin } = await import("./supabase");
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data } = await sb
        .from("projects")
        .select("telegram_chat_id, client_email")
        .eq("id", projectId)
        .maybeSingle();
      const candidate = (data?.telegram_chat_id as string | undefined) || data?.client_email;
      if (candidate && /^-?\d+$/.test(String(candidate))) {
        chatId = String(candidate);
      }
    }
  } catch (e) {
    console.warn("[telegram] chat-id lookup failed:", (e as Error).message);
  }

  if (!chatId && fallbackChatId && /^-?\d+$/.test(fallbackChatId)) {
    chatId = fallbackChatId;
  }

  if (!chatId) {
    console.log(`📨 Telegram(mock): [${projectId}] ${preview}`);
    return {
      ok: true,
      mock: true,
      reason: "no telegram_chat_id (project column or TELEGRAM_CHAT_ID env)",
    };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔔 [${projectId}] ${preview}`,
        }),
      }
    );
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; description?: string }
      | null;
    if (!res.ok || !body?.ok) {
      console.error(
        `[telegram] sendMessage failed status=${res.status} desc=${body?.description}`
      );
      return {
        ok: false,
        mock: false,
        chat_id: chatId,
        reason: body?.description ?? `http ${res.status}`,
      };
    }
    console.log(`📨 Telegram(sent): [${projectId}] → ${chatId}`);
    return { ok: true, mock: false, chat_id: chatId };
  } catch (e) {
    console.error(`[telegram] sendMessage threw:`, (e as Error).message);
    return {
      ok: false,
      mock: false,
      chat_id: chatId,
      reason: (e as Error).message,
    };
  }
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