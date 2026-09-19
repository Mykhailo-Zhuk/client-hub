import { promises as fs } from "fs";
import path from "path";
import type { Session } from "./types";
import { generateToken } from "./utils";

const DATA_FILE = path.join(process.cwd(), "data", "sessions.json");

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

export async function getAllSessions(): Promise<Session[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Session[];
}

export async function createSession(
  email: string,
  projectId: string
): Promise<Session> {
  const sessions = await getAllSessions();
  const session: Session = {
    token: generateToken(),
    email,
    projectId,
    createdAt: new Date().toISOString(),
  };
  sessions.push(session);
  await fs.writeFile(DATA_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  return session;
}

export async function findSessionByToken(
  token: string
): Promise<Session | undefined> {
  const sessions = await getAllSessions();
  return sessions.find((s) => s.token === token);
}