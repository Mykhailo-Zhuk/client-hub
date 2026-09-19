import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { getAllProjects } from "@/lib/projects";
import { getRecentComments } from "@/lib/comments";
import { timeAgo } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

export default async function AdminPage() {
  const projects = getAllProjects();
  const recent = await getRecentComments(10);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {projects.length} projects · {recent.length} recent updates
        </p>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <Reveal>
            <h2 className="text-lg font-semibold">Projects</h2>
          </Reveal>
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/portal/${p.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {p.client}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={
                        p.status === "active"
                          ? "bg-accent/10 text-accent"
                          : "bg-emerald-500/10 text-emerald-500"
                      }
                    >
                      {p.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {p.progress}%
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="space-y-3">
          <Reveal>
            <h2 className="text-lg font-semibold">Recent activity</h2>
          </Reveal>
          {recent.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.04}>
              <Card className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 text-sm">{c.message}</div>
                  <ArrowUpRight size={12} className="mt-0.5 text-muted-foreground" />
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-mono">{c.projectId}</span>
                  {" · "}
                  {timeAgo(c.timestamp)}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}