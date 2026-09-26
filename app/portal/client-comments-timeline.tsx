"use client";

import { useState, useCallback } from "react";
import { renderSafeMarkdown } from "@/lib/sanitize";
import { Activity, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { ClientCommentForm, type ClientComment } from "./client-comment-form";
import { timeAgo } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/types";

const commentTypeMeta: Record<
  string,
  { icon: any; color: string; labelKey: TranslationKey; bg: string; ring: string }
> = {
  status_update: {
    icon: Activity,
    color: "text-blue-500",
    labelKey: "timeline.type.status",
    bg: "border-blue-500/30",
    ring: "ring-blue-500/20",
  },
  milestone: {
    icon: Sparkles,
    color: "text-accent",
    labelKey: "timeline.type.milestone",
    bg: "border-accent/30",
    ring: "ring-accent/20",
  },
  bug_fix: {
    icon: Activity,
    color: "text-amber-500",
    labelKey: "timeline.type.bugFix",
    bg: "border-amber-500/30",
    ring: "ring-amber-500/20",
  },
  deploy: {
    icon: Activity,
    color: "text-emerald-500",
    labelKey: "timeline.type.deploy",
    bg: "border-emerald-500/30",
    ring: "ring-emerald-500/20",
  },
  general: {
    icon: Activity,
    color: "text-muted-foreground",
    labelKey: "timeline.type.note",
    bg: "border-border",
    ring: "ring-border",
  },
  feedback: {
    icon: Activity,
    color: "text-purple-500",
    labelKey: "timeline.type.feedback",
    bg: "border-purple-500/30",
    ring: "ring-purple-500/20",
  },
  client_reply: {
    icon: Send,
    color: "text-cyan-500",
    labelKey: "timeline.type.you",
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
  const { t, locale } = useLanguage();
  const meta = commentTypeMeta[c.type] || commentTypeMeta.general;
  const Icon = meta.icon;
  const isMine = c.author.toLowerCase() === currentEmail.toLowerCase();

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
          <span className={`font-medium ${meta.color}`}>{t(meta.labelKey)}</span>
          <span>·</span>
          <span>
            {c.pending ? t("timeline.justNow") : timeAgo(c.timestamp, locale)}
          </span>
          <span>·</span>
          <span className="font-mono">{c.author}</span>
          {c.pending && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckCircle2 size={10} /> {t("timeline.sending")}
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
  const { t } = useLanguage();

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
          {t("timeline.title")} · {comments.length}{" "}
          {comments.length === 1 ? t("timeline.update") : t("timeline.updates")}
        </h3>
        {comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("timeline.noUpdatesYet")}
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
          {t("timeline.yourComment")}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("timeline.yourCommentHint")}
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

