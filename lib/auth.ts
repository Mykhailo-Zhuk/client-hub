import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findSessionByToken } from "./sessions";

// On serverless, cookie auth can't reliably hit in-memory sessions across
// invocations. MVP mode: accept ?token=... query (set after /api/auth) as proof
// of magic-link click. Also verify cookie if memory happens to hold it.
export async function requireSession(redirectTo: string): Promise<void> {
  // Server components only get cookies(), so use header-based token check
  // is not available. We rely on cookie presence + best-effort lookup.
  const token = cookies().get("ch_session")?.value;
  if (!token) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  const session = await findSessionByToken(token);
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
}

export async function tryGetSession(): Promise<{
  email: string;
  projectId: string;
} | null> {
  const token = cookies().get("ch_session")?.value;
  if (!token) return null;
  const session = await findSessionByToken(token);
  return session ? { email: session.email, projectId: session.projectId } : null;
}