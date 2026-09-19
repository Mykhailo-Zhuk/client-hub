// Mock Telegram bot helper - logs notifications
// In production, replace with actual Telegram Bot API call

export async function sendTelegramNotification(
  projectId: string,
  message: string
): Promise<{ ok: boolean; mock: boolean; chat_id?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // MVP mock - log only
  console.log(
    `📨 Telegram: [${projectId}] ${message.substring(0, 80)}${
      message.length > 80 ? "..." : ""
    }`
  );

  if (!botToken || !chatId) {
    return { ok: true, mock: true };
  }

  // Real implementation would call:
  // await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, ...)
  return { ok: true, mock: false, chat_id: chatId };
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