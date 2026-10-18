"use client";

import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";
import { useLanguage } from "@/lib/i18n/context";

import { getActiveProjects } from "@/lib/projects";

export function Stats({
  activeProjectsCount,
}: {
  activeProjectsCount?: number;
}) {
  const { t } = useLanguage();
  const count =
    typeof activeProjectsCount === "number"
      ? activeProjectsCount
      : getActiveProjects().length;

  const stats = [
    { label: t("stats.activeProjects"), value: String(count) },
    { label: t("stats.happyClients"), value: "47" },
    { label: t("stats.countries"), value: "8" },
    { label: t("stats.shippedMvps"), value: "23" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.05}>
            <Card className="p-5 text-center">
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}