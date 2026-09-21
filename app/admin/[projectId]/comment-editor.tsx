'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import {
  Send,
  Sparkles,
  Loader2,
  Eye,
  Pencil,
} from 'lucide-react';
import { createCommentAction } from '@/app/actions';

const TYPES = [
  ['update', 'Update'],
  ['milestone', 'Milestone'],
  ['deploy', 'Deploy'],
  ['bug_fix', 'Bug fix'],
  ['general', 'General'],
] as const;

type AgentReply = {
  generatedReply: string;
  model?: string;
};

export default function CommentEditor({ projectId }: { projectId: string }) {
  const [type, setType] = useState<(typeof TYPES)[number][0]>('update');
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [pending, startTransition] = useTransition();
  const [agentPending, startAgentTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        // Server action bypasses /api/comments cookie auth path —
        // service_role key writes to Supabase directly, avoiding
        // "Token does not match project" from stale ch_session cookies.
        const d = await createCommentAction({
          projectId,
          type,
          message,
          author: 'Agent',
        });
        setFeedback(`✅ Published (${d.backend})`);
        setMessage('');
        router.refresh();
      } catch (err) {
        setFeedback(`❌ ${(err as Error).message ?? 'failed'}`);
      }
    });
  }

  function generate() {
    if (!hint.trim()) {
      setFeedback('💡 Add a short hint above first, then click ✨ Generate.');
      return;
    }
    setFeedback(null);
    startAgentTransition(async () => {
      try {
        const res = await fetch('/api/agent/reply', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ projectId, userMessage: hint }),
        });
        if (res.status === 401) {
          setFeedback('❌ Unauthorized — reload the page to refresh session.');
          return;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setFeedback(
            `❌ Agent error ${res.status}: ${d.error ?? 'unknown'}${d.details ? ` — ${d.details}` : ''}`
          );
          return;
        }
        const d = (await res.json()) as AgentReply;
        setMessage(d.generatedReply);
        setFeedback(`✅ Drafted via ${d.model ?? 'agent'} (review before posting)`);
      } catch (e) {
        setFeedback(`❌ ${(e as Error).message}`);
      }
    });
  }

  const previewHtml = (() => {
    if (!message.trim()) return '';
    try {
      return DOMPurify.sanitize(marked.parse(message) as string);
    } catch {
      return '';
    }
  })();

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as (typeof TYPES)[number][0])
          }
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        >
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="AI hint (e.g. confirm payment + next milestone)"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={generate}
          disabled={agentPending}
          className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          {agentPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          Generate
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{mode === 'edit' ? 'Markdown editor' : 'Preview'}</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${
                mode === 'edit'
                  ? 'bg-background text-foreground shadow'
                  : 'hover:text-foreground/80'
              }`}
            >
              <Pencil size={10} /> Edit
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${
                mode === 'preview'
                  ? 'bg-background text-foreground shadow'
                  : 'hover:text-foreground/80'
              }`}
            >
              <Eye size={10} /> Preview
            </button>
          </div>
        </div>
        {mode === 'edit' ? (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type an update… (markdown supported)"
            rows={6}
            className="block w-full bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        ) : (
          <div className="min-h-[120px] bg-background px-4 py-3 text-sm">
            {previewHtml ? (
              <div
                className="prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                Nothing to preview yet.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !message.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Publish
        </button>
        {feedback && (
          <div className="text-xs text-muted-foreground">{feedback}</div>
        )}
      </div>
    </form>
  );
}
