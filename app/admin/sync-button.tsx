'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function SyncSupabaseButton() {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  const handleSync = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/projects/sync', { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
          setFeedback(`✓ ${data.projectsSynced} проєктів, ${data.commentsSynced} коментарів`);
          router.refresh();
          setTimeout(() => setFeedback(null), 4000);
        } else {
          setFeedback(`✗ ${data.error}`);
        }
      } catch (err: any) {
        setFeedback(`✗ ${err?.message}`);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {feedback && (
        <span className="text-xs text-muted-foreground">{feedback}</span>
      )}
      <button
        onClick={handleSync}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
        title="Синхронізувати локальні проєкти та коментарі з Supabase"
      >
        <RefreshCw size={12} className={pending ? 'animate-spin' : ''} />
        {pending ? 'Синхронізація...' : 'Синхронізація з Supabase'}
      </button>
    </div>
  );
}
