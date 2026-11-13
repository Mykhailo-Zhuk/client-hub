"use client";

import type { Comment } from "@/lib/types";
import type { Project } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { computeEffectiveDayCurrent } from "@/lib/project-days";

interface StatsCardProps {
  project: Project;
  comments: Comment[];
}

function isoDay(iso: string): string {
  return iso.slice(0, 10);
}

export function ProjectStats({ project, comments }: StatsCardProps) {
  const { t } = useLanguage();
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

  // --- Milestones timeline (Gantt-style) -----------------------------
  // Split project span into 5 evenly-spaced phases + mark known milestones.
  const phases = [
    { label: "Discovery", pct: 15 },
    { label: "Design", pct: 35 },
    { label: "Build", pct: 55 },
    { label: "QA", pct: 80 },
    { label: "Launch", pct: 100 },
  ];
  const milestoneTypes = new Set(
    comments.filter((c) => c.type === "milestone").map((c) => c.id)
  );

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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Milestones chart */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{t("projectStats.milestones")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("projectStats.milestonesSubtitle")}
              </p>
            </div>
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent">
              {project.progress}%
            </span>
          </div>

          <div className="mt-4">
            <MilestonesChart phases={phases} progress={project.progress} />
          </div>

          <div className="mt-3 grid grid-cols-5 gap-1.5">
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
                  key={p.label}
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

          <div className="mt-3 text-xs text-muted-foreground">
            {milestoneTypes.size > 0
              ? `${milestoneTypes.size} ${t("projectStats.milestonesReached")}`
              : t("projectStats.firstMilestonePending")}
          </div>
        </Card>

        {/* Comments distribution */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold">{t("projectStats.communication")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("projectStats.communicationSubtitle")}
          </p>
          <div className="mt-4 flex items-center gap-6">
            <DonutChart agentPct={agentPct} clientPct={clientPct} />
            <div className="space-y-2 text-sm">
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

function MilestonesChart({
  phases,
  progress,
}: {
  phases: { label: string; pct: number }[];
  progress: number;
}) {
  const width = 420;
  const height = 136;
  const padL = 32;
  const padR = 16;
  const padT = 14;
  const padB = 26;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const clamped = Math.max(0, Math.min(100, progress));
  const yForPct = (pct: number) => padT + innerH - (pct / 100) * innerH;
  const xForStep = (idx: number) => padL + (idx / phases.length) * innerW;

  const targetPoints = [
    { x: xForStep(0), y: yForPct(0), pct: 0 },
    ...phases.map((p, idx) => ({
      x: xForStep(idx + 1),
      y: yForPct(p.pct),
      pct: p.pct,
    })),
  ];

  // Interpolate current X/Y position along the 5-phase polyline
  let currentX = targetPoints[0].x;
  let currentY = targetPoints[0].y;
  const completedPoints: { x: number; y: number }[] = [targetPoints[0]];

  for (let i = 1; i < targetPoints.length; i++) {
    const prev = targetPoints[i - 1];
    const curr = targetPoints[i];
    if (clamped >= curr.pct) {
      completedPoints.push(curr);
      currentX = curr.x;
      currentY = curr.y;
    } else {
      const span = curr.pct - prev.pct || 1;
      const t = Math.max(0, (clamped - prev.pct) / span);
      currentX = prev.x + (curr.x - prev.x) * t;
      currentY = prev.y + (curr.y - prev.y) * t;
      completedPoints.push({ x: currentX, y: currentY });
      break;
    }
  }

  const targetPolyline = targetPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const progressPolyline = completedPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath =
    completedPoints.length > 1
      ? `M ${completedPoints[0].x} ${yForPct(0)} ` +
        completedPoints.map((p) => `L ${p.x} ${p.y}`).join(" ") +
        ` L ${currentX} ${yForPct(0)} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label={`Project milestones progress chart: ${clamped}%`}
    >
      <defs>
        <linearGradient id="milestoneFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 25, 50, 75, 100].map((tick) => {
        const y = yForPct(tick);
        return (
          <g key={tick}>
            <line
              x1={padL}
              y1={y}
              x2={width - padR}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeDasharray={tick === 0 ? undefined : "3 3"}
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px] tabular-nums"
            >
              {tick}%
            </text>
          </g>
        );
      })}

      {/* Planned trajectory */}
      <polyline
        fill="none"
        stroke="currentColor"
        className="text-muted-foreground/35"
        strokeWidth={1.5}
        strokeDasharray="4 4"
        points={targetPolyline}
      />

      {/* Completed area + line */}
      {areaPath && <path d={areaPath} fill="url(#milestoneFill)" />}
      {completedPoints.length > 1 && (
        <polyline
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={progressPolyline}
        />
      )}

      {/* Milestone nodes */}
      {phases.map((p, idx) => {
        const pt = targetPoints[idx + 1];
        const isDone = clamped >= p.pct;
        return (
          <g key={p.label}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={isDone ? "#10b981" : "hsl(var(--background))"}
              stroke={isDone ? "#10b981" : "currentColor"}
              className={isDone ? "" : "text-muted-foreground/50"}
              strokeWidth={2}
            />
            <text
              x={pt.x}
              y={height - 6}
              textAnchor="middle"
              className={`text-[9px] ${
                isDone ? "fill-foreground font-medium" : "fill-muted-foreground"
              }`}
            >
              {p.label}
            </text>
          </g>
        );
      })}

      {/* Current progress marker */}
      <circle
        cx={currentX}
        cy={currentY}
        r={5.5}
        fill="rgb(var(--accent))"
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
    </svg>
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