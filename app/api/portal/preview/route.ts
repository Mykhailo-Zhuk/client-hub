/**
 * Admin "Preview as client" endpoint.
 *
 * Agents logged in via AGENT_SECRET can fetch a magic-link token for any
 * project so they can jump straight into /portal/[projectId] without
 * needing a real magic-link email round-trip.
 *
 * This is what powers the "Client view →" button in /admin/[projectId]
 * so Misha (or another admin) can see exactly what the client sees.
 *
 * Auth: requires `agent_token` cookie == AGENT_SECRET (same as /admin).
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AGENT_SECRET, AGENT_COOKIE } from "@/lib/agent-auth";
import { signPortalToken } from "@/lib/jwt";
import { getProjectByIdAsync } from "@/lib/projects-db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Gate: only authenticated agents can mint preview tokens.
  const cookieToken = (await cookies()).get(AGENT_COOKIE)?.value;
  if (cookieToken !== AGENT_SECRET) {
    return NextResponse.json(
      { error: "Not authenticated as agent" },
      { status: 401 }
    );
  }

  let body: { projectId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const projectId = body.projectId;
  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json(
      { error: "projectId required" },
      { status: 400 }
    );
  }

  const project = await getProjectByIdAsync(projectId);
  if (!project) {
    return NextResponse.json(
      { error: `Project "${projectId}" not found` },
      { status: 404 }
    );
  }

  // Mint a portal token signed for the project's own client_email so the
  // portal renders in the client's identity (not the agent's). Falls back
  // to the project id if the email is missing.
  const email = project.clientEmail || `preview-${project.id}@agent.local`;
  const token = await signPortalToken({ email, projectId: project.id });

  const magicLink = `/portal/${project.id}?token=${encodeURIComponent(token)}`;

  return NextResponse.json({
    ok: true,
    projectId: project.id,
    email,
    magicLink,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/portal/preview",
    method: "POST",
    body: { projectId: "string" },
    auth: "cookie agent_token == AGENT_SECRET",
  });
}
