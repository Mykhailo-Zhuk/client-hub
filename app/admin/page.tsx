import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import ClientMarkdown from '@/components/client-markdown';
import { getProjectsAsync } from '@/lib/projects-db';
import { getRecentCommentsAsync } from '@/lib/comments-db';
import { isSupabaseConfigured, getLastSupabaseError } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import { AlertTriangle, Database, Plus, ArrowUpRight } from 'lucide-react';
import { getServerTranslation } from '@/lib/i18n/server';
import { SyncSupabaseButton } from './sync-button';
import { AdminProjectsList } from './admin-projects-list';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [projects, recent, { locale, t }] = await Promise.all([
    getProjectsAsync(),
    getRecentCommentsAsync(10),
    getServerTranslation(),
  ]);
  const configured = isSupabaseConfigured();
  const supabaseError = getLastSupabaseError();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
            <p className="text-sm text-muted-foreground">
              {projects.length} {t('admin.projectsCount')} · {recent.length} {t('admin.recentUpdatesCount')} · backend:{' '}
              <span
                className={
                  configured && !supabaseError ? 'text-emerald-500' : 'text-amber-500'
                }
              >
                {configured
                  ? supabaseError
                    ? 'supabase (error → json-fallback)'
                    : 'supabase'
                  : 'json-fallback'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncSupabaseButton />
            <a
              href="/admin/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
            >
              <Plus size={12} /> {t('admin.newProject')}
            </a>
          </div>
        </div>
      </Reveal>

      {supabaseError && (
        <Reveal delay={0.03}>
          <Card className="mt-6 border-amber-500/40 bg-amber-500/10 p-4 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                  <strong className="text-amber-500">
                    {t('admin.supabase.warningTitle')}
                  </strong>
                  <p className="mt-1 text-muted-foreground">
                    {t('admin.supabase.errorDetails')}{' '}
                    <code className="rounded bg-background/80 px-1.5 py-0.5 text-foreground">
                      {supabaseError.message}
                    </code>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t('admin.supabase.pausedTip')}
                  </p>
                </div>
              </div>
              <a
                href="/admin"
                className="flex-shrink-0 rounded-md border border-amber-500/40 bg-background px-2.5 py-1 text-xs font-medium text-amber-500 hover:bg-amber-500/10"
              >
                {t('admin.supabase.refresh')}
              </a>
            </div>
          </Card>
        </Reveal>
      )}

      {!configured && (
        <Reveal delay={0.05}>
          <Card className="mt-6 border-amber-500/30 bg-amber-500/5 p-4 text-xs">
            <div className="flex items-start gap-2">
              <Database size={14} className="mt-0.5 text-amber-500" />
              <div>
                <strong>Supabase not configured.</strong>
                <p className="mt-1 text-muted-foreground">
                  Set <code>NEXT_PUBLIC_SUPABASE_URL</code> +{' '}
                  <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code>, then run{' '}
                  <code>npx tsx scripts/migrate-to-supabase.ts</code> to import data.{' '}
                  Apply <code>supabase/migrations/001_initial.sql</code> in the Dashboard SQL
                  editor first.
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdminProjectsList initialProjects={projects} />
        </div>

        <div className="space-y-3">
          <Reveal>
            <h2 className="text-lg font-semibold">{t('admin.recentActivity')}</h2>
          </Reveal>
          {recent.length === 0 ? (
            <Card className="p-4 text-xs text-muted-foreground">
              {t('admin.noUpdates')} <code className="rounded bg-muted px-1">/api/telegram</code>.
            </Card>
          ) : (
            recent.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.04}>
                <Card className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <ClientMarkdown
                      content={c.message}
                      className="prose-comment flex-1 text-sm line-clamp-2 break-words [&_p]:!m-0 [&_ul]:!m-0 [&_ol]:!m-0 [&_li]:!m-0"
                    />
                    <Link
                      href={`/admin/${c.projectId}`}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      title={`Open ${c.projectId}`}
                    >
                      <ArrowUpRight size={12} className="mt-0.5" />
                    </Link>
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    <Link
                      href={`/admin/${c.projectId}`}
                      className="font-mono hover:text-foreground hover:underline"
                    >
                      {c.projectId}
                    </Link>
                    {' · '}
                    {c.author} · {timeAgo(c.timestamp, locale)}
                  </div>
                </Card>
              </Reveal>
            ))
          )}
        </div>
      </div>
    </section>
  );
}