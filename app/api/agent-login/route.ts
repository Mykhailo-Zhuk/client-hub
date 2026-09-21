import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AGENT_SECRET, AGENT_COOKIE } from "@/lib/agent-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const secret = body?.secret;

    if (typeof secret !== "string" || secret !== AGENT_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Invalid agent secret" },
        { status: 401 }
      );
    }

    // Set the agent cookie so the gated layouts let you in.
    (await cookies()).set(AGENT_COOKIE, AGENT_SECRET, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    (await cookies()).delete("agent_token");
  } catch {
    /* best-effort */
  }
  return NextResponse.json({ ok: true });
}