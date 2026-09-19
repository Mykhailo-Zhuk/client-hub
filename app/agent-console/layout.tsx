import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// MVP-only secret. In production, set AGENT_SECRET in env and read from there.
// Anyone hitting /agent-console without this cookie is bounced back to login.
const AGENT_SECRET =
  process.env.AGENT_SECRET || "misha-zhuk-dev-2026";

export default function AgentConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agentToken = cookies().get("agent_token")?.value;

  if (agentToken !== AGENT_SECRET) {
    redirect("/login?type=agent");
  }

  return <>{children}</>;
}