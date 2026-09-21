import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AGENT_SECRET, AGENT_COOKIE } from "@/lib/agent-auth";

export default async function AgentConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agentToken = (await cookies()).get(AGENT_COOKIE)?.value;

  if (agentToken !== AGENT_SECRET) {
    redirect("/login?type=agent");
  }

  return <>{children}</>;
}