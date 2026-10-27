import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPortalToken, signPortalToken } from "@/lib/jwt";
import { updateClientEmail, setClientPassword, getClientPassword } from "@/lib/client-passwords";
import { getProjectByIdAsync } from "@/lib/projects-db";
import { getSupabaseAdmin } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const PROJECTS_FILE = path.join(process.cwd(), "data", "projects.json");

function updateProjectsJsonTelegram(projectId: string, updates: { clientTelegramToken?: string | null; clientTelegramChatId?: string | null }) {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return;
    const raw = fs.readFileSync(PROJECTS_FILE, "utf-8");
    const projects = JSON.parse(raw);
    const target = projects.find((p: any) => p.id === projectId);
    if (target) {
      if (updates.clientTelegramToken !== undefined) target.clientTelegramToken = updates.clientTelegramToken || undefined;
      if (updates.clientTelegramChatId !== undefined) target.clientTelegramChatId = updates.clientTelegramChatId || undefined;
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn("[api/portal/settings] error updating projects.json telegram:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      email,
      password,
      token: bodyToken,
      telegramToken,
      telegramChatId,
      clientTelegramToken,
      clientTelegramChatId,
    } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // 1. Session verification
    let cookieToken: string | undefined;
    try {
      cookieToken = (await cookies()).get("ch_session")?.value;
    } catch {
      // may be called without active request store
    }
    const authHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const token = bodyToken || cookieToken || authHeader;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: missing session token" }, { status: 401 });
    }

    const session = await verifyPortalToken(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: invalid session" }, { status: 401 });
    }

    // Ensure session has access to this project
    if (session.projectId !== projectId) {
      return NextResponse.json({ error: "Forbidden: session does not match project" }, { status: 403 });
    }

    const project = await getProjectByIdAsync(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let emailChanged = false;
    let passwordChanged = false;
    let effectiveEmail = project.clientEmail || session.email;

    // 2. Process email update if provided
    if (email && typeof email === "string") {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail.includes("@")) {
        return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
      }
      if (trimmedEmail !== (project.clientEmail || "").toLowerCase()) {
        await updateClientEmail(projectId, trimmedEmail);
        effectiveEmail = trimmedEmail;
        emailChanged = true;
      }
    }

    // 3. Process password update if provided
    if (password && typeof password === "string") {
      const trimmedPassword = password.trim();
      if (trimmedPassword.length < 3) {
        return NextResponse.json(
          { error: "Password must be at least 3 characters" },
          { status: 400 }
        );
      }
      await setClientPassword(projectId, trimmedPassword);
      passwordChanged = true;
    }

    // 4. Process Telegram settings update if provided
    let telegramChanged = false;
    const finalTgToken = clientTelegramToken !== undefined ? clientTelegramToken : telegramToken;
    const finalTgChatId = clientTelegramChatId !== undefined ? clientTelegramChatId : telegramChatId;

    if (finalTgToken !== undefined || finalTgChatId !== undefined) {
      const tgTokenVal = typeof finalTgToken === "string" ? finalTgToken.trim() : null;
      const tgChatIdVal = typeof finalTgChatId === "string" ? finalTgChatId.trim() : null;

      updateProjectsJsonTelegram(projectId, {
        clientTelegramToken: tgTokenVal,
        clientTelegramChatId: tgChatIdVal,
      });

      const sb = getSupabaseAdmin();
      if (sb) {
        const sbUpdates: Record<string, any> = {};
        if (finalTgToken !== undefined) sbUpdates.client_telegram_token = tgTokenVal || null;
        if (finalTgChatId !== undefined) sbUpdates.client_telegram_chat_id = tgChatIdVal || null;
        if (Object.keys(sbUpdates).length > 0) {
          await sb.from("projects").update(sbUpdates).eq("id", projectId);
        }
      }
      telegramChanged = true;
    }

    if (!emailChanged && !passwordChanged && !telegramChanged) {
      return NextResponse.json({ ok: true, message: "No changes needed", email: effectiveEmail });
    }

    // 4. Issue updated session token (especially if email changed)
    const newToken = await signPortalToken({ email: effectiveEmail, projectId });
    const magicLink = `/portal/${projectId}?token=${newToken}`;

    try {
      (await cookies()).set("ch_session", newToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch (cookieErr: any) {
      console.warn("[api/portal/settings] cookie set warning:", cookieErr?.message);
    }

    return NextResponse.json({
      ok: true,
      email: effectiveEmail,
      projectId,
      emailChanged,
      passwordChanged,
      token: newToken,
      magicLink,
    });
  } catch (err: any) {
    console.error("[api/portal/settings] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 });
  }
}
