/**
 * In-memory session store. Serverless-safe (no fs writes).
 *
 * NOTE: With JWT-based magic links (`lib/jwt.ts`), sessions are stateless.
 * This module is kept only for legacy callers (`lib/auth.ts`) that still
 * look up sessions by token. Sessions don't persist across cold-starts on
 * Vercel/serverless — that's by design: the JWT in the cookie / query string
 * is the real source of truth.
 */
import type { Session } from "./types";
import { generateToken } from "./utils";

declare global {
  // eslint-disable-next-line no-var
  var __ch_sessions: Session[] | undefined;
}

function memStore(): Session[] {
  if (!globalThis.__ch_sessions) globalThis.__ch_sessions = [];
  return globalThis.__ch_sessions;
}

async function readSessions(): Promise<Session[]> {
  // No fs reads — serverless-safe pure memory.
  return memStore();
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
  // In-memory only — survives warm invocations on the same lambda instance.
  // Do NOT persist to disk; fs is read-only on Vercel serverless.
  return session;
}

export async function findSessionByToken(
  token: string
): Promise<Session | undefined> {
  const sessions = await readSessions();
  return sessions.find((s) => s.token === token);
}