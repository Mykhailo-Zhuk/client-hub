'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function confirm() {
    const ok = window.confirm(
      `Delete project "${projectId}" and ALL its updates?\n\nThis cannot be undone.`
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/projects/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'delete failed');
        return;
      }
      router.push('/admin');
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={confirm}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Trash2 size={12} />
        )}
        Delete project
      </button>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
}