'use client';

import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n/context';

export default function AdminProjectLoading() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={14} className="animate-spin text-accent" />
        <span>{t('admin.loading.project')}</span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <Card className="space-y-2 p-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-12 w-full animate-pulse rounded bg-muted/60" />
            <div className="h-12 w-full animate-pulse rounded bg-muted/60" />
            <div className="h-12 w-full animate-pulse rounded bg-muted/60" />
          </Card>
        </aside>

        <main className="col-span-12 space-y-4 lg:col-span-9">
          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
            </div>
            <div className="h-7 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted/60" />
            <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex gap-2">
              <div className="h-8 w-28 animate-pulse rounded bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded bg-muted/60" />
              <div className="h-8 w-24 animate-pulse rounded bg-muted/60" />
            </div>
            <div className="h-24 w-full animate-pulse rounded bg-muted/50" />
            <div className="h-24 w-full animate-pulse rounded bg-muted/50" />
          </Card>
        </main>
      </div>
    </section>
  );
}
