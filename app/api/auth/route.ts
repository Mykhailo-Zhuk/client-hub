import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProjectsByEmailAsync, getProjectByIdAsync } from "@/lib/projects-db";
import { signPortalToken, verifyPortalToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, projectId: providedProjectId } = body;

    console.log("[api/auth] POST email=", email);

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // SECURITY: require an EXACT email match against a known project
    // (owner / contributor). No fallback to "first active project" — that
    // turned the endpoint into an auth bypass for any visitor.
    const matching = await getProjectsByEmailAsync(email);

    let projectId: string | undefined;
    if (matching.length === 1) {
      projectId = matching[0].id;
    } else if (matching.length > 1) {
      // Multiple projects for the same email — require explicit projectId
      // sent by the client (e.g. picked from a list of "your projects").
      if (providedProjectId && typeof providedProjectId === "string") {
        const owned = matching.find((p) => p.id === providedProjectId);
        if (owned) {
          projectId = owned.id;
        } else {
          return NextResponse.json(
            { error: "Project does not belong to this email" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "Multiple projects found — please specify projectId",
            projectIds: matching.map((p) => ({ id: p.id, title: p.title })),
          },
          { status: 409 }
        );
      }
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "No project found for this email" },
        { status: 404 }
      );
    }

    // Defensive sanity check: project must still exist & be active.
    const project = await getProjectByIdAsync(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const token = await signPortalToken({ email, projectId });
    const magicLink = `/portal/${projectId}?token=${token}`;

    // Best-effort cookie: works in dev, may not persist on serverless.
    // The URL-based magic link is the source of truth.
    try {
      cookies().set("ch_session", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch (cookieErr: any) {
      console.warn("[api/auth] could not set cookie:", cookieErr?.message);
    }

    console.log("[api/auth] issued token for", projectId, "magicLink=", magicLink);

    return NextResponse.json({
      ok: true,
      email,
      projectId,
      token,
      magicLink,
      confirmed: true,
    });
  } catch (e: any) {
    console.error("[api/auth] error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Verify JWT — works across serverless instances (stateless)
  const tokenParam = req.nextUrl.searchParams.get("token");
  const cookieToken = cookies().get("ch_session")?.value;
  const token = tokenParam || cookieToken;

  console.log("[api/auth] GET token?", !!token, "from=", tokenParam ? "url" : "cookie");

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyPortalToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // If accessed via ?token=, also set cookie so subsequent requests work
  if (tokenParam && !cookieToken) {
    try {
      cookies().set("ch_session", tokenParam, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch (cookieErr: any) {
      console.warn("[api/auth] cookie set failed:", cookieErr?.message);
    }
  }

  return NextResponse.json({
    authenticated: true,
    email: payload.email,
    projectId: payload.projectId,
  });
}

export async function DELETE() {
  try {
    cookies().delete("ch_session");
  } catch (cookieErr: any) {
    console.warn("[api/auth] cookie delete failed:", cookieErr?.message);
  }
  return NextResponse.json({ ok: true });
}