import { CheckCircle2, ExternalLink, Github } from "lucide-react";
import { getCompletedProjects } from "@/lib/projects";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Reveal } from "../ui/reveal";

export function CompletedProjects() {
  const projects = getCompletedProjects();
  if (projects.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <h2 className="text-3xl font-bold tracking-tight">Completed</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shipped and signed off
        </p>
      </Reveal>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
                <CheckCircle2 size={14} />
                Completed
              </div>
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <div className="mt-1 text-xs text-muted-foreground">
                {p.client}
              </div>
              {p.completedDate && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Shipped: {p.completedDate}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                {p.demo && (
                  <a
                    href={p.demo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink size={12} /> Demo
                  </a>
                )}
                {p.github && (
                  <a
                    href={p.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Github size={12} /> Repo
                  </a>
                )}
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}