import { promises as fs } from "fs";
import path from "path";
import type { Comment, CommentType } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "comments.json");

export async function getAllComments(): Promise<Comment[]> {
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Comment[];
}

export async function getCommentsByProject(
  projectId: string
): Promise<Comment[]> {
  const all = await getAllComments();
  return all
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getRecentComments(limit = 5): Promise<Comment[]> {
  const all = await getAllComments();
  return all
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  return comment;
}