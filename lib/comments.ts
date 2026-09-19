import { promises as fs } from "fs";
import * as path from "path";
import type { Comment, CommentType } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "comments.json");

declare global {
  // eslint-disable-next-line no-var
  var __ch_comments: Comment[] | undefined;
}

function memStore(): Comment[] {
  if (!globalThis.__ch_comments) globalThis.__ch_comments = [];
  return globalThis.__ch_comments;
}

async function readComments(): Promise<Comment[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Comment[];
    // hydrate memory once
    if (memStore().length === 0 && parsed.length > 0) {
      memStore().push(...parsed);
    }
    return memStore().length > 0 ? memStore() : parsed;
  } catch {
    return memStore();
  }
}

async function writeComments(comments: Comment[]): Promise<void> {
  memStore().splice(0, memStore().length, ...comments);
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(comments, null, 2), "utf-8");
  } catch {
    // serverless: in-memory only
  }
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