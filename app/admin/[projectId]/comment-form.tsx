'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';

const TYPES = [
  ['update', 'Update'],
  ['milestone', 'Milestone'],
  ['deploy', 'Deploy'],
  ['bug_fix', 'Bug fix'],
  ['general', 'General'],
] as const;

export function AdminCommentForm({ projectId }: { projectId: string }) {
  const [type, setType] = useState<(typeof TYPES)[number][0]>('update');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      // Use the unified comments endpoint — picks up Supabase when configured.
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, type, message, author: 'Agent' }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFeedback(`❌ ${d.error ?? 'failed'}`);
        return;
      }
      const d = await res.json();
      setFeedback(`✅ Published (${d.backend ?? 'unknown'})`);
      setMessage('');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof TYPES)[number][0])}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        >
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type an update… (markdown supported)"
        rows={5}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !message.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Publish
        </button>
        {feedback && <div className="text-xs text-muted-foreground">{feedback}</div>}
      </div>
    </form>
  );
}