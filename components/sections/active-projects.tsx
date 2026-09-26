"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Github } from "lucide-react";
import { getActiveProjects } from "@/lib/projects";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Reveal } from "../ui/reveal";
import { useLanguage } from "@/lib/i18n/context";

export function ActiveProjects() {
  const { t } = useLanguage();
  const projects = getActiveProjects();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("activeProjects.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {projects.length} {t("activeProjects.subtitle")}
            </p>
          </div>
        </div>
      </Reveal>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <Card className="overflow-hidden">
              {p.cover && (
                <div
                  className="h-40 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.cover})` }}
                />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/portal/${p.id}`}
                      className="text-lg font-semibold hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {p.client}
                    </div>
                  </div>
                  <Badge className="bg-accent/10 text-accent">
                    {p.progress}%
                  </Badge>
                </div>
                {p.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
                {typeof p.dayCurrent === "number" &&
                  typeof p.dayTotal === "number" && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {t("activeProjects.day")} {p.dayCurrent} / {p.dayTotal}
                        </span>
                        <span>
                          {Math.round((p.dayCurrent / p.dayTotal) * 100)}%{" "}
                          {t("activeProjects.elapsed")}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${Math.min(100, (p.dayCurrent / p.dayTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  {p.demo && (
                    <a
                      href={p.demo}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      <ExternalLink size={12} className="shrink-0" />
                      <span>{t("activeProjects.demo")}</span>
                    </a>
                  )}
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      <Github size={12} className="shrink-0" />
                      <span>{t("activeProjects.repo")}</span>
                    </a>
                  )}
                  <Link
                    href={`/portal/${p.id}`}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:opacity-90"
                  >
                    <span>{t("activeProjects.clientPortal")}</span>
                    <ArrowRight size={12} className="shrink-0" />
                  </Link>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}