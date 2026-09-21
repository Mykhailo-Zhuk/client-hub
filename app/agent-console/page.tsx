"use client";

import { useEffect, useState, useTransition } from "react";
import { renderSafeMarkdown } from "@/lib/sanitize";
import { Send, Loader2, Sparkles, Bot, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import type { Project } from "@/lib/types";

const sampleUpdates = [
  `## Status update\nPushed latest changes to staging.\n\n- Fixed login redirect\n- Added empty state to inbox\n- \`npm run build\` passes ✓`,
  `## Milestone\nGoogle-style booking form **done** ✅\n\nSee: [demo](https://example.com)`,
  `## Bug fix\n- Theme toggle Sun/Moon was swapped\n- Now matches user expectation\n- Re-deployed`,
];

export default function AgentConsolePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [type, setType] = useState("status_update");
  const [markdown, setMarkdown] = useState(sampleUpdates[0]);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects || []);
        if (d.projects?.length > 0) setSelectedId(d.projects[0].id);
      });
  }, []);

  const preview = renderSafeMarkdown(markdown);

  function publish() {
    if (!selectedId || !markdown.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: selectedId,
          type,
          message: markdown,
          author: "Agent",
        }),
      });
      if (res.ok) {
        setFeedback("✅ Published · Telegram notification queued (mock)");
        setMarkdown("");
      } else {
        const d = await res.json();
        setFeedback(`❌ ${d.error}`);
      }
    });
  }

  return (
    <section className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-10 sm:py-14">
      <Reveal>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Bot size={20} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Agent console</h1>
            <p className="text-sm text-muted-foreground">
              Post markdown updates that flow into the client portal and trigger
              Telegram notifications.
            </p>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/agent-login", { method: "DELETE" });
              window.location.href = "/login";
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <Reveal delay={0.05}>
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.client} — {p.title}
                  </option>
                ))}
              </select>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              >
                <option value="status_update">Status</option>
                <option value="milestone">Milestone</option>
                <option value="bug_fix">Bug fix</option>
                <option value="deploy">Deploy</option>
                <option value="general">General</option>
              </select>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="## Update&#10;Write markdown..."
              rows={14}
              className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-accent"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                onClick={publish}
                disabled={pending || !markdown.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Publish
                  </>
                )}
              </button>
              {feedback && (
                <div className="text-xs text-muted-foreground">{feedback}</div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setMarkdown(sampleUpdates[0])}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Sparkles size={10} /> sample 1
              </button>
              <button
                onClick={() => setMarkdown(sampleUpdates[1])}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Sparkles size={10} /> sample 2
              </button>
              <button
                onClick={() => setMarkdown(sampleUpdates[2])}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Sparkles size={10} /> sample 3
              </button>
            </div>
          </Card>
        </Reveal>

        {/* Preview */}
        <Reveal delay={0.1}>
          <Card className="p-5">
            <div className="text-xs font-medium text-muted-foreground">
              Preview · markdown
            </div>
            <div
              className="prose-comment mt-3 max-w-full break-words text-sm"
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <Card className="mt-6 overflow-x-hidden p-5 text-xs text-muted-foreground">
          <strong className="text-foreground">How it works:</strong> POST to{" "}
          <code className="break-all rounded bg-muted px-1">/api/comments</code> writes to{" "}
          <code className="break-all rounded bg-muted px-1">data/comments.json</code> and
          fires{" "}
          <code className="break-all rounded bg-muted px-1">sendTelegramNotification()</code>{" "}
          (mock log only — wire real{" "}
          <code className="break-all rounded bg-muted px-1">TELEGRAM_BOT_TOKEN</code> to
          enable).
        </Card>
      </Reveal>
    </section>
  );
}