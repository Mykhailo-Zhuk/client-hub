'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin error]', error);
  }, [error]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6">
        <div className="flex items-center gap-2 text-red-500">
          <AlertTriangle size={20} />
          <h1 className="text-xl font-bold">Помилка завантаження адмін-панелі</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Виникла помилка під час звернення до сервера або бази даних. Деталі помилки наведено нижче:
        </p>
        <div className="mt-4 space-y-2 rounded border border-border bg-background p-4 font-mono text-xs">
          <div>
            <span className="text-muted-foreground">name: </span>
            <span className="text-red-400">{error.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">message: </span>
            <span className="text-red-400">{error.message}</span>
          </div>
          {error.digest ? (
            <div>
              <span className="text-muted-foreground">digest: </span>
              <span className="text-amber-400">{error.digest}</span>
            </div>
          ) : null}
          {error.stack ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-muted-foreground">
                stack trace
              </summary>
              <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all text-[11px] text-foreground/80">
                {error.stack}
              </pre>
            </details>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:opacity-90"
          >
            <RotateCcw size={13} /> Спробувати знову
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted"
          >
            <Home size={13} /> На головну
          </Link>
        </div>
      </div>
    </section>
  );
}
