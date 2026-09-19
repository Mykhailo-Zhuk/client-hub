import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProjectsByEmail, getAllProjects } from "@/lib/projects";
import { signPortalToken, verifyPortalToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // Find project by email, fallback to first active project for demo
    let projects = getProjectsByEmail(email);
    if (projects.length === 0) {
      projects = getAllProjects().filter((p) => p.status === "active");
    }

    if (projects.length === 0) {
      return NextResponse.json(
        { error: "No projects found" },
        { status: 404 }
      );
    }

    const projectId = projects[0].id;
    const token = await signPortalToken({ email, projectId });

    // Set cookie (best-effort; works in dev, may not persist on serverless)
    cookies().set("ch_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      ok: true,
      email,
      projectId,
      token,
      magicLink: `/portal/${projectId}?token=${token}`,
      confirmed: true,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Verify JWT — works across serverless instances (stateless)
  const tokenParam = req.nextUrl.searchParams.get("token");
  const cookieToken = cookies().get("ch_session")?.value;
  const token = tokenParam || cookieToken;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyPortalToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // If accessed via ?token=, also set cookie so subsequent requests work
  if (tokenParam && !cookieToken) {
    cookies().set("ch_session", tokenParam, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return NextResponse.json({
    authenticated: true,
    email: payload.email,
    projectId: payload.projectId,
  });
}

export async function DELETE() {
  cookies().delete("ch_session");
  return NextResponse.json({ ok: true });
}