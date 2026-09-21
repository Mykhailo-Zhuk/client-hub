"use client";

import { useState, useCallback } from "react";
import { renderSafeMarkdown } from "@/lib/sanitize";
import { Activity, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { ClientCommentForm, type ClientComment } from "./client-comment-form";
import { timeAgo } from "@/lib/utils";

const commentTypeMeta: Record<
  string,
  { icon: any; color: string; label: string; bg: string; ring: string }
> = {
  status_update: {
    icon: Activity,
    color: "text-blue-500",
    label: "Status",
    bg: "border-blue-500/30",
    ring: "ring-blue-500/20",
  },
  milestone: {
    icon: Sparkles,
    color: "text-accent",
    label: "Milestone",
    bg: "border-accent/30",
    ring: "ring-accent/20",
  },
  bug_fix: {
    icon: Activity,
    color: "text-amber-500",
    label: "Bug fix",
    bg: "border-amber-500/30",
    ring: "ring-amber-500/20",
  },
  deploy: {
    icon: Activity,
    color: "text-emerald-500",
    label: "Deploy",
    bg: "border-emerald-500/30",
    ring: "ring-emerald-500/20",
  },
  general: {
    icon: Activity,
    color: "text-muted-foreground",
    label: "Note",
    bg: "border-border",
    ring: "ring-border",
  },
  feedback: {
    icon: Activity,
    color: "text-purple-500",
    label: "Feedback",
    bg: "border-purple-500/30",
    ring: "ring-purple-500/20",
  },
  client_reply: {
    icon: Send,
    color: "text-cyan-500",
    label: "You",
    bg: "border-cyan-500/40 bg-cyan-500/5",
    ring: "ring-cyan-500/30",
  },
};

function CommentItem({
  c,
  currentEmail,
  onReplace,
  onRemove,
}: {
  c: ClientComment;
  currentEmail: string;
  onReplace?: (oldId: string, next: ClientComment) => void;
  onRemove?: (id: string) => void;
}) {
  const meta = commentTypeMeta[c.type] || commentTypeMeta.general;
  const Icon = meta.icon;
  const isMine = c.author.toLowerCase() === currentEmail.toLowerCase();

  // Use a local state so the parent can replace pending with real later
  return (
    <div
      className={`flex gap-3 rounded-md border-l-2 pl-4 ${
        isMine ? `${meta.bg}` : "border-border"
      } ${c.pending ? "opacity-70" : ""}`}
      data-comment-id={c.id}
    >
      <div className="-ml-[22px] mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-2 ring-border">
        <Icon size={10} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className={`font-medium ${meta.color}`}>{meta.label}</span>
          <span>·</span>
          <span>
            {c.pending ? "just now" : timeAgo(c.timestamp)}
          </span>
          <span>·</span>
          <span className="font-mono">{c.author}</span>
          {c.pending && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckCircle2 size={10} /> sending...
            </span>
          )}
        </div>
        <div
          className="prose-comment mt-1 text-sm break-words"
          dangerouslySetInnerHTML={{
            __html: renderSafeMarkdown(c.message),
          }}
        />
      </div>
    </div>
  );
}

export function ClientCommentsTimeline({
  projectId,
  initialComments,
  clientEmail,
  token,
}: {
  projectId: string;
  initialComments: ClientComment[];
  clientEmail: string;
  token?: string;
}) {
  // Sort chronologically (newest first) — matches server behavior.
  const [comments, setComments] = useState<ClientComment[]>(
    [...initialComments].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  );

  const handlePosted = useCallback(
    (payload: ClientComment & { _replaceId?: string; _rollback?: boolean }) => {
      setComments((prev) => {
        // Rollback: remove the pending optimistic entry
        if ((payload as any)._rollback) {
          return prev.filter((c) => c.id !== payload.id);
        }
        // Replace: swap pending optimistic for server-returned comment
        if ((payload as any)._replaceId) {
          const replaceId = (payload as any)._replaceId;
          const { _replaceId, _rollback, ...clean } = payload as any;
          const next = prev.map((c) =>
            c.id === replaceId ? { ...clean, pending: false } : c
          );
          // Make sure server-returned comment is at top
          next.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()
          );
          return next;
        }
        // New optimistic entry
        const next = [...prev, payload];
        next.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        );
        return next;
      });
    },
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Timeline · {comments.length}{" "}
          {comments.length === 1 ? "update" : "updates"}
        </h3>
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No updates yet — stay tuned.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <CommentItem key={c.id} c={c} currentEmail={clientEmail} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
        <h3 className="text-sm font-semibold text-cyan-500">
          Ваш коментар
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Markdown підтримується. Агент побачить ваше повідомлення одразу.
        </p>
        <div className="mt-3">
          <ClientCommentForm
            projectId={projectId}
            author={clientEmail}
            token={token}
            onPosted={handlePosted}
          />
        </div>
      </div>
    </div>
  );
}
