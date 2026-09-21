/**
 * Agent-gated layout. Reuses the existing `agent_token` cookie set by
 * /api/agent-login. Renders children only when the cookie matches
 * AGENT_SECRET (env) or the MVP dev fallback. Bouncing visitors to login
 * preserves the ?redirect=/admin intent so they land back here instead of
 * in /agent-console.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AGENT_SECRET = process.env.AGENT_PASSWORD || process.env.AGENT_SECRET || 'dev-agent-secret';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const agentToken = (await cookies()).get('agent_token')?.value;
  if (agentToken !== AGENT_SECRET) {
    redirect('/login?type=agent&redirect=%2Fadmin');
  }
  return <>{children}</>;
}