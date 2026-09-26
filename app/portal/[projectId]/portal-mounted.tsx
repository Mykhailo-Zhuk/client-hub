"use client";

import { useEffect, useState, type ReactNode } from "react";

export function PortalMounted({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14 animate-pulse">
        {/* Navigation skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-8 w-20 rounded bg-muted" />
        </div>

        {/* Title and header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="h-5 w-24 rounded-full bg-muted" />
            <div className="h-9 w-64 rounded-lg bg-muted" />
            <div className="h-4 w-36 rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-md bg-muted" />
            <div className="h-8 w-20 rounded-md bg-muted" />
          </div>
        </div>

        {/* Stats card skeleton */}
        <div className="mt-8 h-40 w-full rounded-xl bg-muted/60" />

        {/* Main grid skeleton */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 rounded-xl bg-muted/60" />
          <div className="space-y-4">
            <div className="h-36 rounded-xl bg-muted/60" />
            <div className="h-28 rounded-xl bg-muted/60" />
            <div className="h-28 rounded-xl bg-muted/60" />
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
