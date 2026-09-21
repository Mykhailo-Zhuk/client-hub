import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Card } from "@/components/ui/card";
import { Sparkles, KeyRound } from "lucide-react";
import { AgentUnlockForm } from "./agent-unlock-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  const isAgent = params?.type === "agent";
  return (
    <section className="mx-auto flex max-w-md flex-col gap-6 px-4 py-20">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <KeyRound size={20} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Track your project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAgent
            ? "Enter the agent secret to access the console."
            : "Enter your email to see real-time updates from your team."}
        </p>
      </div>
      <Card className="p-6">
        {isAgent ? (
          <Suspense fallback={<div className="h-32" />}>
            <AgentUnlockForm />
          </Suspense>
        ) : (
          <Suspense fallback={<div className="h-32" />}>
            <LoginForm />
          </Suspense>
        )}
      </Card>
      {!isAgent && (
        <Card className="p-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="mt-0.5 flex-shrink-0 text-accent" />
            <div>
              <strong className="text-foreground">MVP demo:</strong> any email
              works. Mock magic link is generated instantly. Try{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                client@iron-master.example
              </code>{" "}
              or{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                client@spa-canada.example
              </code>
              .
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}