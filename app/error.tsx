'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root error boundary]:', error);
  }, [error]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-red-500">
        <div className="flex items-center gap-2">
          <AlertTriangle size={22} />
          <h1 className="text-xl font-bold">Something went wrong</h1>
        </div>
        <p className="mt-2 text-sm text-foreground/80">
          An error occurred while loading this page.
        </p>
        <div className="mt-4 space-y-2 rounded border border-border bg-background p-4 font-mono text-xs">
          <div>
            <span className="text-muted-foreground">Error: </span>
            <span className="text-red-400 font-semibold">{error.name}: {error.message}</span>
          </div>
          {error.digest && (
            <div>
              <span className="text-muted-foreground">Digest: </span>
              <span className="text-amber-400">{error.digest}</span>
            </div>
          )}
          {error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Stack trace
              </summary>
              <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/40 p-3 text-[11px] text-foreground/90">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
          >
            <RotateCcw size={13} /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Home size={13} /> Home
          </Link>
        </div>
      </div>
    </section>
  );
}
