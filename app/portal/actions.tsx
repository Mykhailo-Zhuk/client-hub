"use client";

import { useState, useTransition } from "react";
import { Send, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommentForm({
  projectId,
  onPosted,
}: {
  projectId: string;
  onPosted?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("status_update");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, type, message, author: "Agent" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed");
        return;
      }
      setMessage("");
      if (onPosted) onPosted();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        >
          <option value="status_update">Status update</option>
          <option value="milestone">Milestone</option>
          <option value="bug_fix">Bug fix</option>
          <option value="deploy">Deploy</option>
          <option value="general">General</option>
        </select>
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type update... (markdown supported)"
        rows={3}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-500">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || !message.trim()}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        Publish
      </button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
    >
      <LogOut size={12} /> Logout
    </button>
  );
}