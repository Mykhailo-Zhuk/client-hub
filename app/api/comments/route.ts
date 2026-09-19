import { NextRequest, NextResponse } from "next/server";
import { addComment, getCommentsByProject, getAllComments } from "@/lib/comments";
import { getProjectById } from "@/lib/projects";
import { verifyPortalToken } from "@/lib/jwt";
import { sendTelegramNotification } from "@/lib/telegram";
import type { CommentType } from "@/lib/types";

const validTypes: CommentType[] = [
  "status_update",
  "milestone",
  "bug_fix",
  "deploy",
  "general",
  "feedback",
  "client_reply",
];

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const comments = projectId
    ? await getCommentsByProject(projectId)
    : await getAllComments();
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, type, message, author } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: "projectId and message required" },
        { status: 400 }
      );
    }

    const trimmed = String(message).trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }
    if (trimmed.length > 5000) {
      return NextResponse.json(
        { error: "Message too long (max 5000 chars)" },
        { status: 400 }
      );
    }

    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let finalType = validTypes.includes(type) ? type : "general";
    let finalAuthor = (author || "Agent").toString().trim() || "Agent";

    // If a portal session token is presented (header or cookie), the comment
    // is a client reply and must come from the project's client email.
    const headerToken =
      req.headers.get("x-portal-token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const cookieToken = req.cookies.get("ch_session")?.value;
    const token = headerToken || cookieToken;

    if (token) {
      const session = await verifyPortalToken(token);
      if (session && session.projectId === projectId) {
        finalType = "client_reply";
        finalAuthor = session.email;
      } else if (session && session.projectId !== projectId) {
        return NextResponse.json(
          { error: "Token does not match project" },
          { status: 403 }
        );
      }
    }

    const comment = await addComment({
      projectId,
      type: finalType as CommentType,
      message: trimmed,
      author: finalAuthor,
    });

    // Fire-and-forget Telegram notification (only for non-client messages).
    if (finalType !== "client_reply") {
      sendTelegramNotification(projectId, trimmed).catch(console.error);
    } else {
      // For client replies, just log so we know they arrived.
      console.log(
        `[comments] client_reply received projectId=${projectId} author=${finalAuthor}`
      );
    }

    return NextResponse.json({ ok: true, comment });
  } catch (e: any) {
    console.error("[comments] POST error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
