/**
 * In-memory comment fallback (serverless-safe, no fs).
 *
 * The primary store is Supabase (`lib/comments-db.ts`). This module is
 * loaded only as a fallback when Supabase env vars are not configured,
 * so dev works out-of-the-box without external infrastructure.
 *
 * Notes:
 *   - Comments live in `globalThis.__ch_comments` and persist across
 *     warm invocations on the same lambda instance.
 *   - On Vercel serverless each cold start starts with an empty store —
 *     this is acceptable for local dev only.
 */
import type { Comment, CommentType } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __ch_comments: Comment[] | undefined;
}

function memStore(): Comment[] {
  if (!globalThis.__ch_comments) globalThis.__ch_comments = [];
  return globalThis.__ch_comments;
}

async function readComments(): Promise<Comment[]> {
  // No fs.readFile — serverless-safe pure memory.
  return memStore();
}

async function writeComments(comments: Comment[]): Promise<void> {
  // In-memory only — no fs.writeFile (which silently no-ops on Vercel).
  memStore().splice(0, memStore().length, ...comments);
}

export async function getAllComments(): Promise<Comment[]> {
  return readComments();
}

export async function getCommentsByProject(
  projectId: string
): Promise<Comment[]> {
  const all = await getAllComments();
  return all
    .filter((c) => c.projectId === projectId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}

export async function getRecentComments(limit = 5): Promise<Comment[]> {
  const all = await getAllComments();
  return all
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, limit);
}

export async function addComment(input: {
  projectId: string;
  type: CommentType;
  message: string;
  author: string;
}): Promise<Comment> {
  const all = await getAllComments();
  const comment: Comment = {
    id: `c${Date.now()}`,
    projectId: input.projectId,
    type: input.type,
    message: input.message,
    author: input.author,
    timestamp: new Date().toISOString(),
  };
  all.push(comment);
  await writeComments(all);
  return comment;
}