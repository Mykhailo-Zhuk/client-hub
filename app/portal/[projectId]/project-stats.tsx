import type { Comment } from "@/lib/types";
import type { Project } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, MessageSquare } from "lucide-react";

interface StatsCardProps {
  project: Project;
  comments: Comment[];
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function isoDay(iso: string): string {
  return iso.slice(0, 10);
}

export function ProjectStats({ project, comments }: StatsCardProps) {
  const now = new Date();
  const start = new Date(project.startDate);
  const daysElapsed = daysBetween(start, now);
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
            <Clock size={12} /> Days
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
            <Activity size={12} /> Progress
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {project.progress}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 size={12} /> Tasks
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
            <MessageSquare size={12} /> Comments / 7d
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
            <h3 className="text-sm font-semibold">Activity — last 30 days</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Each square is one day. Darker = more updates.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            Less
            <span className="h-3 w-3 rounded-sm bg-muted" />
            <span className="h-3 w-3 rounded-sm bg-accent/30" />
            <span className="h-3 w-3 rounded-sm bg-accent/60" />
            <span className="h-3 w-3 rounded-sm bg-accent" />
            More
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
          {comments.length} total updates ·{" "}
          {daysRemaining > 0
            ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`
            : "On the home stretch"}
        </div>
      </Card>

      {/* Milestones + Comments distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Milestones timeline */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold">Milestones</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Project plan vs. today&apos;s progress.
          </p>
          <div className="mt-4 space-y-3">
            {phases.map((p, i) => {
              const isDone = project.progress >= p.pct;
              const isCurrent =
                project.progress < p.pct &&
                project.progress >= (i === 0 ? 0 : phases[i - 1].pct);
              return (
                <div key={p.label} className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-accent text-accent-foreground"
                        : "border border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={
                          isDone || isCurrent
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {p.label}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {p.pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          isDone
                            ? "bg-emerald-500"
                            : isCurrent
                            ? "bg-accent"
                            : "bg-transparent"
                        }`}
                        style={{
                          width: `${Math.min(100, project.progress <= p.pct ? project.progress : 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {milestoneTypes.size > 0
              ? `${milestoneTypes.size} milestone${milestoneTypes.size === 1 ? "" : "s"} reached`
              : "First milestone pending"}
          </div>
        </Card>

        {/* Comments distribution */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold">Communication</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Agent vs. client updates.
          </p>
          <div className="mt-4 flex items-center gap-6">
            <DonutChart agentPct={agentPct} clientPct={clientPct} />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-accent" />
                <span className="font-medium">Agent</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {agentCount} · {agentPct}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                <span className="font-medium">Client</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {clientCount} · {clientPct}%
                </span>
              </div>
              <div className="border-t border-border pt-2 text-xs text-muted-foreground">
                {clientCount === 0
                  ? "Awaiting your first reply."
                  : clientCount >= agentCount * 0.3
                  ? "Great back-and-forth balance."
                  : "Agent leading the conversation."}
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