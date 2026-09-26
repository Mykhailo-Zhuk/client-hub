"use client";

import { useState, useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export interface ClientComment {
  id: string;
  projectId: string;
  type: string;
  message: string;
  author: string;
  timestamp: string;
  pending?: boolean;
}

export function ClientCommentForm({
  projectId,
  author,
  token,
  onPosted,
}: {
  projectId: string;
  author: string;
  token?: string;
  onPosted: (c: ClientComment) => void;
}) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setError(null);

    // Optimistic update — show comment immediately.
    const optimistic: ClientComment = {
      id: `pending-${Date.now()}`,
      projectId,
      type: "client_reply",
      message: trimmed,
      author,
      timestamp: new Date().toISOString(),
      pending: true,
    };
    onPosted(optimistic);
    setMessage("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(token ? { "x-portal-token": token } : {}),
          },
          body: JSON.stringify({
            projectId,
            message: trimmed,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to publish comment");
          // Rollback optimistic update
          onPosted({ ...optimistic, _rollback: true } as any);
          return;
        }
        // Replace pending optimistic with the real one
        onPosted({
          ...(data.comment as ClientComment),
          pending: false,
          _replaceId: optimistic.id,
        } as any);
      } catch (err: any) {
        setError(err?.message || "Network error");
        onPosted({ ...optimistic, _rollback: true } as any);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("commentForm.placeholder")}
        rows={3}
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-500">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {t("commentForm.loggedInAs")} <span className="font-mono">{author}</span>
        </div>
        <button
          type="submit"
          disabled={pending || !message.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 size={12} className="animate-spin" /> {t("commentForm.sending")}
            </>
          ) : (
            <>
              <Send size={12} /> {t("commentForm.publish")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
