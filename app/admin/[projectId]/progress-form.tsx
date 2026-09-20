'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';

export function ProgressForm({
  projectId,
  initialProgress,
  initialStatus,
}: {
  projectId: string;
  initialProgress: number;
  initialStatus: 'active' | 'completed' | 'paused';
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  function save() {
    setFeedback(null);
    startTransition(async () => {
      const res = await fetch('/api/projects/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, progress, status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFeedback(`❌ ${d.error ?? 'failed'}`);
        return;
      }
      setFeedback('✅ Saved');
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Progress: {progress}%
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="mt-1 block w-full"
        />
      </label>
      <label className="block text-sm">
        Status
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save
        </button>
        {feedback && <div className="text-xs text-muted-foreground">{feedback}</div>}
      </div>
    </div>
  );
}