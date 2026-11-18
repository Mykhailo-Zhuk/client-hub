"use client";

import { useState } from "react";
import type { Comment, Project } from "@/lib/types";
import { Card } from "@/components/ui/card";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  MessageSquare,
  Rocket,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { computeEffectiveDayCurrent } from "@/lib/project-days";

interface StatsCardProps {
  project: Project;
  comments: Comment[];
}

function isoDay(iso: string): string {
  return iso.slice(0, 10);
}

/** Strip markdown formatting noise for compact single-line / two-line milestone summaries. */
function summarizeMilestoneMessage(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[-*]\s+/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/`([^`]*)`/g, "$1")
        .trim()
    )
    .filter(Boolean);
  return lines.join(" — ");
}

function formatMilestoneDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function ProjectStats({ project, comments }: StatsCardProps) {
  const { t, locale } = useLanguage();
  const [showAllMilestones, setShowAllMilestones] = useState(false);
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

  // --- Milestones timeline (real deliverables + delivery stages) ------
  const phases = [
    { key: "discovery", label: t("projectStats.phase.discovery"), pct: 15 },
    { key: "design", label: t("projectStats.phase.design"), pct: 35 },
    { key: "build", label: t("projectStats.phase.build"), pct: 55 },
    { key: "qa", label: t("projectStats.phase.qa"), pct: 80 },
    { key: "launch", label: t("projectStats.phase.launch"), pct: 100 },
  ];
  const milestoneEvents = [...comments]
    .filter((c) => c.type === "milestone" || c.type === "deploy")
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  const milestoneCount = milestoneEvents.filter(
    (c) => c.type === "milestone"
  ).length;
  const visibleMilestones = showAllMilestones
    ? milestoneEvents
    : milestoneEvents.slice(-4);
  const hiddenMilestoneCount = milestoneEvents.length - visibleMilestones.length;

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

      {/* Milestones + Comments distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Milestones roadmap */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{t("projectStats.milestones")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("projectStats.milestonesSubtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                {milestoneCount > 0
                  ? `${milestoneCount} ${t("projectStats.milestonesReached")}`
                  : t("projectStats.firstMilestonePending")}
              </span>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent">
                {project.progress}%
              </span>
            </div>
          </div>

          {/* 5-stage delivery progress bar */}
          <div className="mt-4">
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }}
              />
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {phases.map((p, i) => {
                const prevPct = i === 0 ? 0 : phases[i - 1].pct;
                const isDone = project.progress >= p.pct;
                const isCurrent = project.progress < p.pct && project.progress >= prevPct;
                const phasePct = isDone
                  ? 100
                  : isCurrent
                  ? Math.round(((project.progress - prevPct) / (p.pct - prevPct)) * 100)
                  : 0;
                return (
                  <div
                    key={p.key}
                    className={`rounded-md border px-2 py-1.5 text-center ${
                      isDone
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : isCurrent
                        ? "border-accent/40 bg-accent/10"
                        : "border-border bg-muted/40"
                    }`}
                  >
                    <div className="truncate text-[11px] font-medium text-foreground">
                      {p.label}
                    </div>
                    <div
                      className={`mt-0.5 text-[10px] font-semibold tabular-nums ${
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isCurrent
                          ? "text-accent"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isDone ? "✓ 100%" : `${phasePct}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real project milestones & releases list */}
          <div className="mt-4 border-t border-border pt-4">
            {milestoneEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4 text-center text-xs text-muted-foreground">
                {t("projectStats.noMilestonesYet")}
              </div>
            ) : (
              <>
                {milestoneEvents.length > 4 && (
                  <div className="mb-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAllMilestones((v) => !v)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                    >
                      {showAllMilestones ? (
                        <>
                          {t("projectStats.showLessMilestones")}
                          <ChevronUp size={12} />
                        </>
                      ) : (
                        <>
                          {t("projectStats.showAllMilestones")} (+{hiddenMilestoneCount})
                          <ChevronDown size={12} />
                        </>
                      )}
                    </button>
                  </div>
                )}

                <ol className="relative space-y-3 pl-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
                  {visibleMilestones.map((m, idx) => {
                    const stepNumber = showAllMilestones
                      ? idx + 1
                      : hiddenMilestoneCount + idx + 1;
                    const isDeploy = m.type === "deploy";
                    const summary = summarizeMilestoneMessage(m.message);
                    return (
                      <li key={m.id} className="relative">
                        <span
                          aria-hidden="true"
                          className={`absolute -left-5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                            isDeploy
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                              : "border-accent/40 bg-accent/15 text-accent"
                          }`}
                        >
                          {isDeploy ? <Rocket size={9} /> : <Flag size={9} />}
                        </span>
                        <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                                #{stepNumber}
                              </span>
                              <span
                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  isDeploy
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-accent/15 text-accent"
                                }`}
                              >
                                {isDeploy
                                  ? t("timeline.type.deploy")
                                  : t("timeline.type.milestone")}
                              </span>
                            </div>
                            <time
                              dateTime={m.timestamp}
                              className="text-[11px] tabular-nums text-muted-foreground"
                            >
                              {formatMilestoneDate(m.timestamp, locale)}
                            </time>
                          </div>
                          <p
                            title={summary}
                            className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/90"
                          >
                            {summary}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </div>
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