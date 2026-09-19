import { promises as fs } from "fs";
import * as path from "path";
import type { Session } from "./types";
import { generateToken } from "./utils";

const DATA_FILE = path.join(process.cwd(), "data", "sessions.json");

// In-memory store for serverless (Vercel) where /data is read-only
declare global {
  // eslint-disable-next-line no-var
  var __ch_sessions: Session[] | undefined;
}

function memStore(): Session[] {
  if (!globalThis.__ch_sessions) globalThis.__ch_sessions = [];
  return globalThis.__ch_sessions;
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    try {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, "[]", "utf-8");
    } catch {
      // serverless: read-only fs, use memory only
    }
  }
}

async function readSessions(): Promise<Session[]> {
  await ensureFile();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Session[];
  } catch {
    return memStore();
  }
}

async function writeSessions(sessions: Session[]): Promise<void> {
  memStore().splice(0, memStore().length, ...sessions);
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  } catch {
    // serverless: keep in memory only
  }
}

export async function getAllSessions(): Promise<Session[]> {
  return readSessions();
}

export async function createSession(
  email: string,
  projectId: string
): Promise<Session> {
  const sessions = await readSessions();
  const session: Session = {
    token: generateToken(),
    email,
    projectId,
    createdAt: new Date().toISOString(),
  };
  sessions.push(session);
  await writeSessions(sessions);
  return session;
}

export async function findSessionByToken(
  token: string
): Promise<Session | undefined> {
  const sessions = await readSessions();
  return sessions.find((s) => s.token === token);
}