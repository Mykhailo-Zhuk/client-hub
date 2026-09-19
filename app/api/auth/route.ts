import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProjectsByEmail, getAllProjects } from "@/lib/projects";
import { createSession, findSessionByToken } from "@/lib/sessions";

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
    const session = await createSession(email, projectId);

    // Set cookie (best-effort on serverless; we also return a signed-style
    // token via query so the magic-link "click" can be simulated)
    cookies().set("ch_session", session.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      ok: true,
      email,
      projectId,
      token: session.token,
      magicLink: `/portal/${projectId}?token=${session.token}`,
      confirmed: true,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const tokenParam = req.nextUrl.searchParams.get("token");
  if (tokenParam) {
    const session = await findSessionByToken(tokenParam);
    if (session) {
      cookies().set("ch_session", tokenParam, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return NextResponse.json({
        authenticated: true,
        email: session.email,
        projectId: session.projectId,
      });
    }
  }

  const token = cookies().get("ch_session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const session = await findSessionByToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    email: session.email,
    projectId: session.projectId,
  });
}

export async function DELETE() {
  cookies().delete("ch_session");
  return NextResponse.json({ ok: true });
}