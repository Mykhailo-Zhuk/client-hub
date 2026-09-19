import { NextRequest, NextResponse } from "next/server";
import { parseTelegramUpdate, sendTelegramNotification } from "@/lib/telegram";

// Telegram bot webhook (mock - logs only)
// Real bot would validate secret token, handle commands, etc.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const update = parseTelegramUpdate(body);

    // Mock: respond to /status command
    if (update.text?.startsWith("/status")) {
      await sendTelegramNotification(
        update.from || "unknown",
        `📊 Status: ${update.text}`
      );
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
    message: "Telegram bot endpoint (MVP mock — logs only)",
  });
}