import { NextRequest, NextResponse } from "next/server";
import { addComment, getCommentsByProject, getAllComments } from "@/lib/comments";
import { sendTelegramNotification } from "@/lib/telegram";
import type { CommentType } from "@/lib/types";

const validTypes: CommentType[] = [
  "status_update",
  "milestone",
  "bug_fix",
  "deploy",
  "general",
  "feedback",
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
    const finalType = (validTypes.includes(type) ? type : "general") as CommentType;

    const comment = await addComment({
      projectId,
      type: finalType,
      message,
      author: author || "Agent",
    });

    // Fire-and-forget Telegram notification
    sendTelegramNotification(projectId, message).catch(console.error);

    return NextResponse.json({ ok: true, comment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}