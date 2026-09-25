import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ExternalLink, Github, Calendar } from "lucide-react";
import Link from "next/link";
import { getProjectById } from "@/lib/projects";
import { getCommentsByProjectAsync } from "@/lib/comments-db";
import { verifyPortalToken } from "@/lib/jwt";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { formatDate } from "@/lib/utils";
import { LogoutButton } from "../actions";
import { ClientCommentsTimeline } from "../client-comments-timeline";
import type { ClientComment } from "../client-comment-form";
import { ProjectStats } from "./project-stats";
import { ClientAttention } from "./client-attention";
import type { Comment } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { projectId } = await params;
  const sp = await searchParams;

  // Stateless JWT auth — works across serverless instances.
  // Prefer the URL ?token= (always available from /api/auth's magicLink);
  // fall back to cookie (best-effort). On Vercel serverless, the cookie
  // set in /api/auth's response may not persist to the next request, so
  // the URL token is the source of truth.
  let token = (await cookies()).get("ch_session")?.value;
  const source = token ? "cookie" : sp.token ? "url" : "none";
  if (!token && sp.token) {
    token = sp.token;
  }
  if (!token) {
    console.log(`[portal/${projectId}] no token (source=${source}) → /login`);
    redirect(`/login?redirect=/portal/${projectId}`);
  }

  const session = await verifyPortalToken(token);
  if (!session) {
    console.log(`[portal/${projectId}] invalid JWT (source=${source}) → /login`);
    redirect(`/login?redirect=/portal/${projectId}`);
  }

  console.log(`[portal/${projectId}] auth OK email=${session.email} source=${source}`);

  const project = getProjectById(projectId);
  if (!project) notFound();

  const comments = await getCommentsByProjectAsync(project.id);

  // Fetch project requests for the client
  let projectRequests: any[] = [];
  try {
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data } = await sb
        .from('project_requests')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      if (data) projectRequests = data;
    }
  } catch (err) {
    console.error(`[portal/${projectId}] failed to fetch requests:`, err);
  }

  const dayPercent =
    project.dayCurrent && project.dayTotal
      ? Math.min(100, (project.dayCurrent / project.dayTotal) * 100)
      : null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
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

      <div className="mt-8">
        <ClientAttention requests={projectRequests} />
      </div>

      {project.cover && (
        <Reveal delay={0.05}>
          <div
            className="mt-6 h-48 w-full rounded-xl bg-cover bg-center sm:h-64"
            style={{ backgroundImage: `url(${project.cover})` }}
          />
        </Reveal>
      )}

      <Reveal delay={0.08}>
        <div className="mt-8">
          <ProjectStats project={project} comments={comments as unknown as Comment[]} />
        </div>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Reveal>
            <Card className="p-6">
              <h2 className="text-lg font-semibold">Project timeline</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                All updates, milestones, and your replies in one stream.
              </p>

              <div className="mt-6">
                <ClientCommentsTimeline
                  projectId={project.id}
                  clientEmail={project.clientEmail || session.email}
                  token={token}
                  initialComments={comments as unknown as ClientComment[]}
                />
              </div>
            </Card>
          </Reveal>
        </div>

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
                    <span>
                      Day {project.dayCurrent} / {project.dayTotal}
                    </span>
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