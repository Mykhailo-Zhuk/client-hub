"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Github } from "lucide-react";
import { getCompletedProjects } from "@/lib/projects";
import type { Project } from "@/lib/types";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Reveal } from "../ui/reveal";
import { useLanguage } from "@/lib/i18n/context";

export function CompletedProjects({ projects: initialProjects }: { projects?: Project[] } = {}) {
  const { t } = useLanguage();
  const projects = initialProjects ?? getCompletedProjects();
  if (projects.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <h2 className="text-3xl font-bold tracking-tight">{t("completedProjects.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("completedProjects.subtitle")}
        </p>
      </Reveal>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => {
          const isSample = Boolean(
            p.isSample ||
              p.id === "iron-master" ||
              p.id === "universal-service-template"
          );
          return (
            <Reveal key={p.id} delay={i * 0.08}>
              <Card className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                      <CheckCircle2 size={14} />
                      {t("completedProjects.badge")}
                    </div>
                    {isSample && (
                      <Badge className="border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        ✨ {t("projects.sampleBadge")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold">
                    <Link
                      href={`/portal/${p.id}`}
                      className="hover:text-accent hover:underline"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.client}
                  </div>
                  {isSample && (
                    <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-300">
                      <span className="shrink-0">✨</span>
                      <span>{t("projects.sampleNotice")}</span>
                    </div>
                  )}
                  {p.description && (
                    <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  {p.completedDate && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {t("completedProjects.shipped")}: {p.completedDate}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.tags || []).map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 pt-2">
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
              </Card>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}