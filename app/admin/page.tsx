import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { getProjectsAsync } from '@/lib/projects-db';
import { getRecentCommentsAsync } from '@/lib/comments-db';
import { isSupabaseConfigured } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import { Database, Plus, ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [projects, recent] = await Promise.all([
    getProjectsAsync(),
    getRecentCommentsAsync(10),
  ]);
  const configured = isSupabaseConfigured();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {projects.length} projects · {recent.length} recent updates · backend:{' '}
              <span
                className={
                  configured ? 'text-emerald-500' : 'text-amber-500'
                }
              >
                {configured ? 'supabase' : 'json-fallback'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90"
            >
              <Plus size={12} /> New Project
            </a>
          </div>
        </div>
      </Reveal>

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
        <div className="lg:col-span-2 space-y-3">
          <Reveal>
            <h2 className="text-lg font-semibold">Projects</h2>
          </Reveal>
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Link
                      href={`/admin/${p.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {p.client}
                      {p.clientEmail ? ` · ${p.clientEmail}` : ''}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(p.tags ?? []).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={
                        p.status === 'active'
                          ? 'bg-accent/10 text-accent'
                          : p.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }
                    >
                      {p.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">{p.progress}%</div>
                    <Link
                      href={`/admin/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      Manage <ArrowUpRight size={10} />
                    </Link>
                  </div>
                </div>
                {p.dayCurrent !== undefined && p.dayTotal ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${Math.min(100, (p.dayCurrent / p.dayTotal) * 100)}%` }}
                    />
                  </div>
                ) : null}
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="space-y-3">
          <Reveal>
            <h2 className="text-lg font-semibold">Recent activity</h2>
          </Reveal>
          {recent.length === 0 ? (
            <Card className="p-4 text-xs text-muted-foreground">
              No updates yet. Open a project and post from the Comments tab, or use <code className="rounded bg-muted px-1">/api/telegram</code>.
            </Card>
          ) : (
            recent.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.04}>
                <Card className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 text-sm line-clamp-2">{c.message}</div>
                    <ArrowUpRight size={12} className="mt-0.5 text-muted-foreground" />
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">{c.projectId}</span>
                    {' · '}
                    {c.author} · {timeAgo(c.timestamp)}
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