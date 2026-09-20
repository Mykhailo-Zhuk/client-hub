import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { ExternalLink, Github, ArrowLeft, Calendar } from 'lucide-react';
import { getProjectByIdAsync } from '@/lib/projects-db';
import { getCommentsByProjectAsync } from '@/lib/comments-db';
import { timeAgo, formatDate } from '@/lib/utils';
import { AdminCommentForm } from './comment-form';
import { ProgressForm } from './progress-form';

export const dynamic = 'force-dynamic';

export default async function AdminProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const project = await getProjectByIdAsync(params.projectId);
  if (!project) notFound();

  const comments = await getCommentsByProjectAsync(project.id);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <Reveal>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back to admin
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge
              className={
                project.status === 'active'
                  ? 'mb-2 bg-accent/10 text-accent'
                  : project.status === 'completed'
                  ? 'mb-2 bg-emerald-500/10 text-emerald-500'
                  : 'mb-2 bg-amber-500/10 text-amber-500'
              }
            >
              {project.status === 'active' ? 'In progress' : project.status}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {project.client}
              {project.clientEmail ? ` · ${project.clientEmail}` : ''}
            </div>
            {project.description && (
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted"
              >
                <ExternalLink size={12} /> Demo
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
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
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Reveal>
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Publish update</h2>
              <AdminCommentForm projectId={project.id} />
            </Card>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">
                Activity ({comments.length})
              </h2>
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No updates yet.</p>
              ) : (
                <ol className="space-y-3">
                  {comments.map((c) => (
                    <li key={c.id} className="border-l-2 border-accent/30 pl-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{c.type}</span>
                        <span>
                          {c.author} · {timeAgo(c.timestamp)}
                        </span>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">
                        {c.message}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </Reveal>
        </div>

        <div className="space-y-4">
          <Reveal>
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Project state</h2>
              <ProgressForm
                projectId={project.id}
                initialProgress={project.progress}
                initialStatus={project.status}
              />
            </Card>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="p-5 text-xs">
              <h2 className="mb-3 text-sm font-semibold">Meta</h2>
              <dl className="space-y-1.5 text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Started</dt>
                  <dd className="text-foreground">{formatDate(project.startDate)}</dd>
                </div>
                {project.estimatedEnd && (
                  <div className="flex justify-between">
                    <dt>Est. end</dt>
                    <dd className="text-foreground">{formatDate(project.estimatedEnd)}</dd>
                  </div>
                )}
                {project.completedDate && (
                  <div className="flex justify-between">
                    <dt>Completed</dt>
                    <dd className="text-foreground">{formatDate(project.completedDate)}</dd>
                  </div>
                )}
                {project.dayCurrent !== undefined && project.dayTotal ? (
                  <div className="flex justify-between">
                    <dt>Day</dt>
                    <dd className="text-foreground">
                      {project.dayCurrent} / {project.dayTotal}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt>Tags</dt>
                  <dd className="flex flex-wrap justify-end gap-1">
                    {(project.tags ?? []).map((t) => (
                      <Badge key={t} className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}