import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ExternalLink,
  Github,
} from 'lucide-react';
import { getProjectByIdAsync } from '@/lib/projects-db';
import { getCommentsByProjectAsync } from '@/lib/comments-db';
import { getProjectsAsync } from '@/lib/projects-db';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';
import ProjectList from '../project-list';
import CommentThread from './comment-thread';
import CommentEditor from './comment-editor';
import ProjectStats from './project-stats';
import ProjectSettingsForm from './project-settings-form';
import { DeleteProjectButton } from './delete-button';

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

  // Load sidebar list and the selected project in parallel.
  const [project, allProjects] = await Promise.all([
    getProjectByIdAsync(projectId),
    getProjectsAsync(),
  ]);

  if (!project) notFound();

  // Hydrate Supabase columns that may not be in JSON fallback (demo/github/tags etc.).
  let supabaseExtras: Partial<AdminProject> = {};
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data } = await sb
        .from('projects')
        .select(
          'id, title, client_name, client_email, status, progress, day_current, day_total, start_date, demo, github'
        )
        .eq('id', projectId)
        .maybeSingle();
      if (data) {
        supabaseExtras = data as Partial<AdminProject>;
      }
    }
  }

  const merged: AdminProject = {
    ...(project as unknown as AdminProject),
    ...supabaseExtras,
  };

  const comments = await getCommentsByProjectAsync(project.id);

  // Sidebar expects client/progress/status — adapt JSON shape.
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
          <ArrowLeft size={12} /> Back to admin
        </Link>
      </Reveal>

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
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {comments.length} update{comments.length === 1 ? '' : 's'}
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
                      <ExternalLink size={12} /> Demo
                    </a>
                  )}
                  {merged.github && (
                    <a
                      href={merged.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                    >
                      <Github size={12} /> Repo
                    </a>
                  )}
                  <Link
                    href={`/portal/${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    Client view →
                  </Link>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
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
                    Day {merged.day_current} / {merged.day_total}
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
                    Comments ({comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
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
                    <h3 className="mb-2 text-sm font-semibold">New update</h3>
                    <CommentEditor projectId={project.id} />
                  </div>
                </TabsContent>

                <TabsContent value="overview">
                  <ProjectStats project={merged} />
                </TabsContent>

                <TabsContent value="settings">
                  <ProjectSettingsForm project={merged} />
                  <div className="mt-6 border-t border-red-500/20 pt-4">
                    <h3 className="mb-2 text-sm font-semibold text-red-500">
                      Danger zone
                    </h3>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Permanently delete this project and all its updates.
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
