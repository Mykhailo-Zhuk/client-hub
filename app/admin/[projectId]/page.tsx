import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Github,
} from 'lucide-react';
import { getProjectByIdAsync, getProjectsAsync } from '@/lib/projects-db';
import { getCommentsByProjectAsync } from '@/lib/comments-db';
import { getRequestsByProjectAsync } from '@/lib/requests-db';
import { getLastSupabaseError } from '@/lib/supabase';
import { getServerTranslation } from '@/lib/i18n/server';

import ProjectList from '../project-list';
import CommentThread from './comment-thread';
import CommentEditor from './comment-editor';
import ProjectStats from './project-stats';
import ProjectSettingsForm from './project-settings-form';
import { DeleteProjectButton } from './delete-button';
import { ClientPreviewButton } from './client-preview-button';
import ClientRequestsManager from './client-requests';

export const dynamic = 'force-dynamic';

type AdminProject = {
  id: string;
  title: string;
  description?: string | null;
  client_name: string;
  client?: string;
  client_email?: string | null;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  day_current?: number;
  day_total?: number;
  start_date?: string | null;
  estimated_end?: string | null;
  completed_date?: string | null;
  demo?: string | null;
  github?: string | null;
  tags?: string[];
};

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  try {
    return await renderAdminProject(projectId);
  } catch (err) {
    const e = err as Error & { digest?: string };
    if (e?.digest?.startsWith('NEXT_')) {
      throw err;
    }
    console.error(`[admin/${projectId}] render failed:`, e);
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={20} />
            <h1 className="text-xl font-bold">
              Помилка завантаження проєкту <code>/admin/{projectId}</code>
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Сталася помилка під час рендерингу сторінки проєкту на сервері. Нижче наведено деталі помилки:
          </p>
          <div className="mt-4 space-y-1 rounded border border-border bg-background p-4 font-mono text-xs">
            <div>
              <span className="text-muted-foreground">name: </span>
              <span className="text-red-400">{e.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">message: </span>
              <span className="text-red-400">{e.message}</span>
            </div>
            {e.stack ? (
              <pre className="mt-2 max-h-[60vh] overflow-auto whitespace-pre-wrap break-all text-[11px] text-foreground/80">
                {e.stack}
              </pre>
            ) : null}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <a
              href={`/admin/${projectId}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-medium text-accent-foreground hover:opacity-90"
            >
              Спробувати знову
            </a>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted"
            >
              <ArrowLeft size={12} /> Назад в адмінку
            </Link>
          </div>
        </div>
      </section>
    );
  }
}

async function renderAdminProject(projectId: string) {
  // Run all data fetches in parallel so even if Supabase is slow, we never chain timeouts sequentially.
  const [project, allProjects, comments, projectRequests, { t }] = await Promise.all([
    getProjectByIdAsync(projectId),
    getProjectsAsync(),
    getCommentsByProjectAsync(projectId),
    getRequestsByProjectAsync(projectId),
    getServerTranslation(),
  ]);

  if (!project) notFound();

  const supabaseError = getLastSupabaseError();

  const merged: AdminProject = {
    id: project.id,
    title: project.title,
    description: project.description ?? null,
    client_name: project.client,
    client: project.client,
    client_email: project.clientEmail ?? null,
    status: project.status,
    progress: project.progress,
    day_current: project.dayCurrent,
    day_total: project.dayTotal,
    start_date: project.startDate ?? null,
    estimated_end: project.estimatedEnd ?? null,
    completed_date: project.completedDate ?? null,
    demo: project.demo ?? null,
    github: project.github ?? null,
    tags: project.tags ?? [],
  };

  const hasPendingRequests = projectRequests.some((r) => r.status === 'pending');

  const sidebarItems = allProjects.map((p) => ({
    id: p.id,
    title: p.title,
    client: p.client,
    status: p.status as 'active' | 'paused' | 'completed',
    progress: p.progress,
  }));

  const statusColor =
    merged.status === 'active'
      ? 'bg-accent/10 text-accent'
      : merged.status === 'completed'
      ? 'bg-emerald-500/10 text-emerald-500'
      : 'bg-amber-500/10 text-amber-500';

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Reveal>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={12} /> {t('admin.backToAdmin')}
        </Link>
      </Reveal>

      {supabaseError && (
        <Reveal>
          <Card className="mb-6 border-amber-500/40 bg-amber-500/10 p-4 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                <div>
                  <strong className="text-amber-500">
                    З&apos;єднання з Supabase тимчасово недоступне — увімкнено резервний режим (JSON fallback)
                  </strong>
                  <p className="mt-1 text-muted-foreground">
                    Деталі помилки: <code className="rounded bg-background/80 px-1.5 py-0.5 text-foreground">{supabaseError.message}</code>
                  </p>
                </div>
              </div>
              <a
                href={`/admin/${projectId}`}
                className="flex-shrink-0 rounded-md border border-amber-500/40 bg-background px-2.5 py-1 text-xs font-medium text-amber-500 hover:bg-amber-500/10"
              >
                Оновити
              </a>
            </div>
          </Card>
        </Reveal>
      )}

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <Card className="sticky top-4 p-3">
            <ProjectList
              projects={sidebarItems}
              activeId={project.id}
            />
          </Card>
        </aside>

        <main className="col-span-12 space-y-4 lg:col-span-9">
          <Reveal>
            <Card className="p-6">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor}>{merged.status}</Badge>
                    {hasPendingRequests && (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                        {t('admin.pendingRequests')}
                      </Badge>
                    )}
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {comments.length} {comments.length === 1 ? t('timeline.update') : t('timeline.updates')}
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight">
                    {merged.title}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {merged.client_name ?? merged.client}
                    {merged.client_email ? ` · ${merged.client_email}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {merged.demo && (
                    <a
                      href={merged.demo}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <ExternalLink size={12} /> {t('portal.demo')}
                    </a>
                  )}
                  {merged.github && (
                    <a
                      href={merged.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <Github size={12} /> {t('portal.repo')}
                    </a>
                  )}
                  <ClientPreviewButton projectId={project.id} />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('portal.progress')}</span>
                  <span className="font-mono">{merged.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, merged.progress))}%` }}
                  />
                </div>
                {merged.day_current !== undefined && merged.day_total ? (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {t('portal.day')} {merged.day_current} / {merged.day_total}
                  </div>
                ) : null}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="p-4">
              <Tabs defaultValue="comments">
                <TabsList>
                  <TabsTrigger value="comments">
                    {t('admin.tabs.comments')} ({comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="requests">
                    {t('admin.tabs.requests')}
                  </TabsTrigger>
                  <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
                  <TabsTrigger value="settings">{t('admin.tabs.settings')}</TabsTrigger>
                </TabsList>

                <TabsContent value="comments">
                  <CommentThread
                    comments={comments.map((c) => ({
                      id: c.id,
                      type: c.type,
                      author: c.author,
                      message: c.message,
                      timestamp: c.timestamp,
                      parent_id: (c as { parent_id?: string | null }).parent_id ?? null,
                    }))}
                  />
                  <div className="mt-4 border-t border-border pt-4">
                    <h3 className="mb-2 text-sm font-semibold">{t('admin.newUpdate')}</h3>
                    <CommentEditor projectId={project.id} />
                  </div>
                </TabsContent>

                <TabsContent value="requests">
                  <ClientRequestsManager 
                    projectId={project.id} 
                    initialRequests={projectRequests} 
                  />
                </TabsContent>

                <TabsContent value="overview">
                  <ProjectStats project={merged} />
                </TabsContent>

                <TabsContent value="settings">
                  <ProjectSettingsForm project={merged} />
                  <div className="mt-6 border-t border-red-500/20 pt-4">
                    <h3 className="mb-2 text-sm font-semibold text-red-500">
                      {t('admin.dangerZone')}
                    </h3>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {t('admin.deleteWarning')}
                    </p>
                    <DeleteProjectButton projectId={project.id} />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </Reveal>
        </main>
      </div>
    </section>
  );
}
