import { getRecentComments } from "@/lib/comments";
import { timeAgo } from "@/lib/utils";
import { Card } from "../ui/card";
import { Reveal } from "../ui/reveal";
import { Activity, Bug, Rocket, Sparkles, MessageSquare } from "lucide-react";
import type { CommentType } from "@/lib/types";

const iconMap: Record<CommentType, typeof Activity> = {
  status_update: Activity,
  milestone: Sparkles,
  bug_fix: Bug,
  deploy: Rocket,
  general: MessageSquare,
  feedback: MessageSquare,
  client_reply: MessageSquare,
};

const colorMap: Record<CommentType, string> = {
  status_update: "text-blue-500",
  milestone: "text-accent",
  bug_fix: "text-amber-500",
  deploy: "text-emerald-500",
  general: "text-muted-foreground",
  feedback: "text-purple-500",
  client_reply: "text-cyan-500",
};

export async function RecentUpdates() {
  const comments = await getRecentComments(5);
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Reveal>
        <h2 className="text-3xl font-bold tracking-tight">Recent updates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest activity across all projects
        </p>
      </Reveal>
      <div className="mt-8 space-y-3">
        {comments.map((c, i) => {
          const Icon = iconMap[c.type];
          return (
            <Reveal key={c.id} delay={i * 0.05}>
              <Card className="flex items-start gap-4 p-4">
                <Icon
                  size={18}
                  className={`mt-0.5 flex-shrink-0 ${colorMap[c.type]}`}
                />
                <div className="flex-1">
                  <div className="text-sm">{c.message}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{c.projectId}</span>
                    <span>·</span>
                    <span>{c.author}</span>
                    <span>·</span>
                    <span>{timeAgo(c.timestamp)}</span>
                  </div>
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}