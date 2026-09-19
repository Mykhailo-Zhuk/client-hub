import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ExternalLink, Github, Calendar, Activity, Sparkles } from "lucide-react";
import Link from "next/link";
import { getProjectById } from "@/lib/projects";
import { getCommentsByProject } from "@/lib/comments";
import { findSessionByToken } from "@/lib/sessions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { formatDate, timeAgo } from "@/lib/utils";
import { CommentForm, LogoutButton } from "../actions";

const commentTypeMeta: Record<string, { icon: any; color: string; label: string }> = {
  status_update: { icon: Activity, color: "text-blue-500", label: "Status" },
  milestone: { icon: Sparkles, color: "text-accent", label: "Milestone" },
  bug_fix: { icon: Activity, color: "text-amber-500", label: "Bug fix" },
  deploy: { icon: Activity, color: "text-emerald-500", label: "Deploy" },
  general: { icon: Activity, color: "text-muted-foreground", label: "Note" },
  feedback: { icon: Activity, color: "text-purple-500", label: "Feedback" },
};

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: { projectId: string };
  searchParams: { token?: string };
}) {
  // Verify session — support both cookie (persistent) and ?token= (magic-link click on serverless)
  let token = cookies().get("ch_session")?.value;
  if (!token && searchParams.token) {
    token = searchParams.token;
  }
  if (!token) redirect(`/login?redirect=/portal/${params.projectId}`);
  const session = await findSessionByToken(token);
  if (!session) redirect(`/login?redirect=/portal/${params.projectId}`);

  const project = getProjectById(params.projectId);
  if (!project) notFound();

  const comments = await getCommentsByProject(project.id);

  const dayPercent =
    project.dayCurrent && project.dayTotal
      ? Math.min(100, (project.dayCurrent / project.dayTotal) * 100)
      : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
        <LogoutButton />
      </div>

      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge className="mb-2 bg-accent/10 text-accent">
              {project.status === "active" ? "In progress" : project.status}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {project.client}
            </div>
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
          </div>
        </div>
      </Reveal>

      {/* Project cover */}
      {project.cover && (
        <Reveal delay={0.05}>
          <div
            className="mt-6 h-48 w-full rounded-xl bg-cover bg-center sm:h-64"
            style={{ backgroundImage: `url(${project.cover})` }}
          />
        </Reveal>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left: timeline / comments */}
        <div className="lg:col-span-2 space-y-6">
          <Reveal>
            <Card className="p-6">
              <h2 className="text-lg font-semibold">Project timeline</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                All updates, milestones, and deploys in one stream.
              </p>

              <div className="mt-6 space-y-4">
                {comments.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No updates yet — stay tuned.
                  </div>
                )}
                {comments.map((c) => {
                  const meta = commentTypeMeta[c.type] || commentTypeMeta.general;
                  const Icon = meta.icon;
                  return (
                    <div key={c.id} className="flex gap-3 border-l-2 border-border pl-4">
                      <div className="-ml-[22px] mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-2 ring-border">
                        <Icon size={10} className={meta.color} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={`font-medium ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span>·</span>
                          <span>{timeAgo(c.timestamp)}</span>
                          <span>·</span>
                          <span>{c.author}</span>
                        </div>
                        <div className="mt-1 text-sm">{c.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Reveal>

          {/* Agent add comment (visible because portal is for client + agent preview) */}
          <Reveal delay={0.05}>
            <Card className="p-6">
              <h2 className="text-sm font-semibold">Post update</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Agent-only — posts to timeline and triggers Telegram.
              </p>
              <div className="mt-4">
                <CommentForm projectId={project.id} />
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Right: project meta */}
        <div className="space-y-4">
          <Reveal delay={0.1}>
            <Card className="p-5">
              <div className="text-xs text-muted-foreground">Progress</div>
              <div className="mt-1 text-3xl font-bold">{project.progress}%</div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              {dayPercent !== null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Day {project.dayCurrent} / {project.dayTotal}</span>
                    <span>{Math.round(dayPercent)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent/60"
                      style={{ width: `${dayPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </Reveal>

          <Reveal delay={0.15}>
            <Card className="p-5">
              <div className="text-xs text-muted-foreground">Started</div>
              <div className="mt-1 text-sm font-medium">
                <Calendar size={12} className="mr-1 inline" />
                {formatDate(project.startDate)}
              </div>
              {project.estimatedEnd && (
                <>
                  <div className="mt-3 text-xs text-muted-foreground">ETA</div>
                  <div className="mt-1 text-sm font-medium">
                    {formatDate(project.estimatedEnd)}
                  </div>
                </>
              )}
            </Card>
          </Reveal>

          <Reveal delay={0.2}>
            <Card className="p-5">
              <div className="text-xs text-muted-foreground">Stack</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </Card>
          </Reveal>

          {project.description && (
            <Reveal delay={0.25}>
              <Card className="p-5">
                <div className="text-xs text-muted-foreground">Brief</div>
                <p className="mt-2 text-sm text-foreground/90">
                  {project.description}
                </p>
              </Card>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}