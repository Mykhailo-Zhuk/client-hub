import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPortalToken } from "./jwt";

/**
 * Server-component session guard.
 *
 * We treat the JWT in the `ch_session` cookie (or the `token` query param
 * for SSR contexts where cookies() isn't reachable from the request) as
 * the source of truth. Verification is stateless via jose — works across
 * Vercel serverless cold starts, no in-memory store required.
 *
 * On serverless, `cookies()` in a server component only sees what the
 * browser sent. If the user came in via a magic link with `?token=...`,
 * the redirect middleware on `/portal/[id]` will set the cookie on the
 * first navigation, so subsequent server renders have it.
 */
export async function requireSession(redirectTo: string): Promise<void> {
  const token = (await cookies()).get("ch_session")?.value;
  if (!token) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  const payload = await verifyPortalToken(token);
  if (!payload) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
}

export async function tryGetSession(): Promise<{
  email: string;
  projectId: string;
} | null> {
  const token = (await cookies()).get("ch_session")?.value;
  if (!token) return null;
  const payload = await verifyPortalToken(token);
  return payload ? { email: payload.email, projectId: payload.projectId } : null;
}