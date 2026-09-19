"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";

export function AgentUnlockForm() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!secret.trim()) {
      setError("Please enter the agent secret");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/agent-login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ secret }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Invalid secret");
          return;
        }
        // Cookie set on server. Redirect to console.
        window.location.href = "/agent-console";
      } catch (err: any) {
        setError(err?.message || "Network error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-sm font-medium">Agent secret</span>
        <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-accent">
          <KeyRound size={14} className="text-muted-foreground" />
          <input
            type="password"
            placeholder="••••••••••••"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
            autoComplete="off"
          />
        </div>
      </label>
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Unlocking...
          </>
        ) : (
          <>
            Unlock console <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}