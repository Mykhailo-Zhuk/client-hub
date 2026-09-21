/**
 * Agent-gated layout. Reuses the existing `agent_token` cookie set by
 * /api/agent-login. Renders children only when the cookie matches
 * AGENT_SECRET (env) or the MVP dev fallback. Bouncing visitors to login
 * preserves the ?redirect=/admin intent so they land back here instead of
 * in /agent-console.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AGENT_SECRET, AGENT_COOKIE } from '@/lib/agent-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const agentToken = (await cookies()).get(AGENT_COOKIE)?.value;
  if (agentToken !== AGENT_SECRET) {
    // Build the redirect target with proper URL encoding so query values
    // containing slashes (e.g. ?redirect=/admin) survive the round-trip.
    const url = new URL('/login', 'http://placeholder');
    url.searchParams.set('type', 'agent');
    url.searchParams.set('redirect', '/admin');
    redirect(url.pathname + url.search);
  }
  return <>{children}</>;
}