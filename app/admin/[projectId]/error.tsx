'use client';

/**
 * Error boundary for /admin/[projectId] — surfaces the actual exception
 * instead of the generic Next.js 500 page. Used to debug the
 * "iron-master 500" incident on 2026-09-21.
 */
import { useEffect } from 'react';

export default function AdminProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin/[projectId] error]', error);
  }, [error]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6">
        <h1 className="text-xl font-bold text-red-500">
          Error loading project
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The admin project page crashed during server render. The full
          error is below — copy it and report to Misha.
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
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
