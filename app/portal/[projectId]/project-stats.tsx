"use client";

import { useState } from "react";
import type { Comment, Project } from "@/lib/types";
import { Card } from "@/components/ui/card";
import {
  Activity,
  ArrowDownRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { computeEffectiveDayCurrent } from "@/lib/project-days";
import { buildProjectWaves, type WorkCategory } from "@/lib/project-waves";

interface StatsCardProps {
  project: Project;
  comments: Comment[];
}

function isoDay(iso: string): string {
  return iso.slice(0, 10);
}

function formatShortDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatWaveRange(startIso: string, endIso: string, locale: string): string {
  const start = formatShortDate(startIso, locale);
  const end = formatShortDate(endIso, locale);
  return start === end ? start : `${start} — ${end}`;
}

function scrollToTimelineComment(commentId: string) {
  const target = document.querySelector<HTMLElement>(
    `[data-comment-id="${CSS.escape(commentId)}"]`
  );
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("ring-2", "ring-accent/60", "rounded-md");
  window.setTimeout(() => {
    target.classList.remove("ring-2", "ring-accent/60", "rounded-md");
  }, 1800);
}

const WORK_CATEGORY_STYLES: Record<
  WorkCategory,
  { color: string; badgeClass: string; labelKey: "timeline.type.milestone" | "timeline.type.deploy" | "timeline.type.bugFix" | "timeline.type.status" }
> = {
  milestone: {
    color: "#6366f1",
    badgeClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    labelKey: "timeline.type.milestone",
  },
  deploy: {
    color: "#10b981",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    labelKey: "timeline.type.deploy",
  },
  bug_fix: {
    color: "#f59e0b",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    labelKey: "timeline.type.bugFix",
  },
  status_update: {
    color: "#3b82f6",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    labelKey: "timeline.type.status",
  },
};

export function ProjectStats({ project, comments }: StatsCardProps) {
  const { t, locale } = useLanguage();
  const [showAllWaves, setShowAllWaves] = useState(false);
  const now = new Date();
  const daysElapsed = project.dayCurrent ?? computeEffectiveDayCurrent(project, now);
  const daysTotal = project.dayTotal ?? Math.max(daysElapsed + 1, 1);
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);

  const tasksCompleted = Math.round((project.progress / 100) * 20);
  const totalTasks = 20;

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const commentsThisWeek = comments.filter(
    (c) => new Date(c.timestamp) >= weekAgo
  ).length;

  // --- Heatmap: 30 days of activity ----------------------------------
  const heatmapDays: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = isoDay(d.toISOString());
    const count = comments.filter((c) => isoDay(c.timestamp) === key).length;
    heatmapDays.push({ date: key, count });
  }
  const maxCount = Math.max(1, ...heatmapDays.map((d) => d.count));

  // --- Comments distribution (Agent vs Client) -----------------------
  const agentCount = comments.filter(
    (c) =>
      c.author !== "Client" &&
      !c.author.startsWith("client@") &&
      c.author !== "You"
  ).length;
  const clientCount = comments.length - agentCount;
  const totalC = Math.max(1, agentCount + clientCount);
  const agentPct = Math.round((agentCount / totalC) * 100);
  const clientPct = 100 - agentPct;

  // --- Delivery Waves & Work Mix -------------------------------------
  const waveSummary = buildProjectWaves(comments, project.status);
  const visibleWaves = showAllWaves
    ? waveSummary.waves
    : waveSummary.waves.slice(0, 3);
  const hiddenWavesCount = waveSummary.waves.length - visibleWaves.length;
  const modeLabel = t(`projectStats.waveMode.${waveSummary.mode}`);
  const workCategories: WorkCategory[] = [
    "milestone",
    "deploy",
    "bug_fix",
    "status_update",
  ];

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={12} /> {t("projectStats.days")}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {daysElapsed}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {daysTotal}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity size={12} /> {t("projectStats.progress")}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {project.progress}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 size={12} /> {t("projectStats.tasks")}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {tasksCompleted}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {totalTasks}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare size={12} /> {t("projectStats.comments7d")}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {commentsThisWeek}
          </div>
        </Card>
      </div>

      {/* Activity heatmap */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t("projectStats.activityTitle")}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("projectStats.activitySubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {t("projectStats.less")}
            <span className="h-3 w-3 rounded-sm bg-muted" />
            <span className="h-3 w-3 rounded-sm bg-accent/30" />
            <span className="h-3 w-3 rounded-sm bg-accent/60" />
            <span className="h-3 w-3 rounded-sm bg-accent" />
            {t("projectStats.more")}
          </div>
        </div>
        <div
          className="mt-4 grid gap-1"
          style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
        >
          {heatmapDays.map((d) => {
            const ratio = d.count / maxCount;
            const bg =
              d.count === 0
                ? "bg-muted"
                : ratio > 0.66
                ? "bg-accent"
                : ratio > 0.33
                ? "bg-accent/60"
                : "bg-accent/30";
            return (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} update${d.count === 1 ? "" : "s"}`}
                className={`aspect-square rounded-sm ${bg}`}
              />
            );
          })}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {comments.length} {t("projectStats.totalUpdates")} ·{" "}
          {daysRemaining > 0
            ? `${daysRemaining} ${daysRemaining === 1 ? t("projectStats.dayLeft") : t("projectStats.daysLeft")}`
            : t("projectStats.homeStretch")}
        </div>
      </Card>

      {/* Delivery Waves + Comments distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Variant 1: Iterative Release Waves & Work Mix */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{t("projectStats.milestones")}</h3>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {modeLabel}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("projectStats.milestonesSubtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                {waveSummary.waves.length}{" "}
                {waveSummary.waves.length === 1
                  ? t("projectStats.waveSingle")
                  : t("projectStats.wavesCount")}
              </span>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent">
                {project.progress}%
              </span>
            </div>
          </div>

          {waveSummary.totalDeliveryUpdates === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
              {t("projectStats.noMilestonesYet")}
            </div>
          ) : (
            <>
              {/* Segmented Work Mix Bar */}
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {t("projectStats.workMixTitle")}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {waveSummary.totalDeliveryUpdates} {t("projectStats.workMixTotal")}
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  {workCategories.map((cat) => {
                    const count = waveSummary.mix[cat];
                    if (!count) return null;
                    const pct = (count / waveSummary.totalDeliveryUpdates) * 100;
                    const meta = WORK_CATEGORY_STYLES[cat];
                    return (
                      <div
                        key={cat}
                        style={{ width: `${pct}%`, backgroundColor: meta.color }}
                        title={`${t(meta.labelKey)}: ${count}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
                  {workCategories.map((cat) => {
                    const meta = WORK_CATEGORY_STYLES[cat];
                    const count = waveSummary.mix[cat];
                    return (
                      <div key={cat} className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="text-muted-foreground">{t(meta.labelKey)}:</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compact Iterative Wave Cards (summary, no full-feed duplication) */}
              <div className="mt-4 space-y-2.5">
                {visibleWaves.map((wave, idx) => {
                  const isNewest = idx === 0;
                  const waveBadge =
                    isNewest && project.status === "active"
                      ? {
                          label: t("projectStats.wave.current"),
                          cls: "bg-accent/15 text-accent",
                        }
                      : isNewest && wave.hasDeploy
                      ? {
                          label: t("projectStats.wave.latestRelease"),
                          cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        }
                      : {
                          label: t("projectStats.wave.completed"),
                          cls: "bg-muted text-muted-foreground",
                        };

                  const countsSummary = workCategories
                    .filter((cat) => wave.counts[cat] > 0)
                    .map((cat) => `${wave.counts[cat]} ${t(WORK_CATEGORY_STYLES[cat].labelKey).toLowerCase()}`)
                    .join(" · ");

                  return (
                    <details
                      key={wave.number}
                      open={isNewest}
                      className="group rounded-xl border border-border bg-muted/20"
                    >
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-[11px] font-bold text-accent">
                            {wave.number}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-xs font-semibold text-foreground">
                                {t("projectStats.waveLabel")} #{wave.number}
                              </span>
                              <span className="text-[11px] tabular-nums text-muted-foreground">
                                {formatWaveRange(wave.startDate, wave.endDate, locale)}
                              </span>
                              {countsSummary && (
                                <span className="text-[11px] text-muted-foreground">
                                  · {countsSummary}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-foreground/85">
                              {wave.headline}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${waveBadge.cls}`}
                        >
                          {waveBadge.label}
                        </span>
                      </summary>

                      <div className="space-y-1.5 border-t border-border/80 px-3.5 py-2.5">
                        {wave.highlights.map((h) => {
                          const meta = WORK_CATEGORY_STYLES[h.type];
                          return (
                            <div
                              key={h.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs"
                            >
                              <div className="flex min-w-0 flex-1 items-start gap-2">
                                <span
                                  className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.badgeClass}`}
                                >
                                  {t(meta.labelKey)}
                                </span>
                                <span className="line-clamp-2 flex-1 text-foreground/90">
                                  {h.summary}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-[11px] tabular-nums text-muted-foreground">
                                  {formatShortDate(h.timestamp, locale)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => scrollToTimelineComment(h.id)}
                                  className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent hover:underline"
                                >
                                  {t("projectStats.jumpToTimeline")}
                                  <ArrowDownRight size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>

              {waveSummary.waves.length > 3 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAllWaves((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                  >
                    {showAllWaves ? (
                      <>
                        {t("projectStats.showLessWaves")}
                        <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        {t("projectStats.showAllWaves")} (+{hiddenWavesCount})
                        <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Comments distribution */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold">{t("projectStats.communication")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("projectStats.communicationSubtitle")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <DonutChart agentPct={agentPct} clientPct={clientPct} />
            <div className="min-w-[140px] flex-1 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-accent" />
                <span className="font-medium">{t("projectStats.agent")}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {agentCount} · {agentPct}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                <span className="font-medium">{t("projectStats.client")}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {clientCount} · {clientPct}%
                </span>
              </div>
              <div className="border-t border-border pt-2 text-xs text-muted-foreground">
                {clientCount === 0
                  ? t("projectStats.awaitingFirstReply")
                  : clientCount >= agentCount * 0.3
                  ? t("projectStats.greatBalance")
                  : t("projectStats.agentLeading")}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DonutChart({
  agentPct,
  clientPct,
}: {
  agentPct: number;
  clientPct: number;
}) {
  const size = 96;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const agentDash = (agentPct / 100) * circumference;
  const clientDash = (clientPct / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-label={`Agent ${agentPct}% client ${clientPct}%`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        className="text-muted"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth={stroke}
        strokeDasharray={`${agentDash} ${circumference - agentDash}`}
        strokeDashoffset={0}
        strokeLinecap="butt"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth={stroke}
        strokeDasharray={`${clientDash} ${circumference - clientDash}`}
        strokeDashoffset={-agentDash}
        strokeLinecap="butt"
      />
    </svg>
  );
}