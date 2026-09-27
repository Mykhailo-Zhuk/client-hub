import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPortalToken, signPortalToken } from "@/lib/jwt";
import { updateClientEmail, setClientPassword, getClientPassword } from "@/lib/client-passwords";
import { getProjectByIdAsync } from "@/lib/projects-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, email, password, token: bodyToken } = body;

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

    if (!emailChanged && !passwordChanged) {
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
