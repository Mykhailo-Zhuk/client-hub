import type { Comment, CommentType, ProjectStatus } from "./types";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export type WorkCategory = "milestone" | "deploy" | "bug_fix" | "status_update";

export interface WorkMixCounts {
  milestone: number;
  deploy: number;
  bug_fix: number;
  status_update: number;
}

export interface WaveHighlight {
  id: string;
  type: WorkCategory;
  timestamp: string;
  summary: string;
}

export interface DeliveryWave {
  /** 1-based chronological wave index (1 = earliest wave). */
  number: number;
  startDate: string;
  endDate: string;
  counts: WorkMixCounts;
  total: number;
  hasDeploy: boolean;
  /** Short 1-line summary representing the wave's main deliverable. */
  headline: string;
  /** ID of the primary comment in this wave for jumping to the timeline. */
  anchorCommentId: string;
  /** Compact list of key milestones/deploys (or fallback updates) in this wave. */
  highlights: WaveHighlight[];
}

export interface ProjectWavesSummary {
  mix: WorkMixCounts;
  totalDeliveryUpdates: number;
  /** Waves ordered newest-first for display. */
  waves: DeliveryWave[];
  /** Suggested status badge key based on project status and wave count. */
  mode: "active" | "paused" | "iterative" | "single_completed";
}

function toWorkCategory(type: CommentType): WorkCategory | null {
  if (type === "client_reply" || type === "feedback") return null;
  if (type === "milestone" || type === "deploy" || type === "bug_fix") {
    return type;
  }
  return "status_update";
}

/** Strip markdown syntax into a clean, compact single-line summary. */
export function summarizeToSingleLine(raw: string, maxLen = 140): string {
  const cleaned = raw
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[-*]\s+/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/`([^`]*)`/g, "$1")
        .trim()
    )
    .filter(Boolean)
    .join(" — ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`;
}

/**
 * Group project delivery comments into iterative release waves.
 * Starts a new wave whenever there is a >= 14-day pause between updates
 * or after a `deploy` closes a release cycle.
 */
export function buildProjectWaves(
  comments: Comment[],
  projectStatus: ProjectStatus
): ProjectWavesSummary {
  const mix: WorkMixCounts = {
    milestone: 0,
    deploy: 0,
    bug_fix: 0,
    status_update: 0,
  };

  const deliveryItems = comments
    .map((c) => {
      const category = toWorkCategory(c.type);
      return category ? { comment: c, category } : null;
    })
    .filter((item): item is { comment: Comment; category: WorkCategory } =>
      Boolean(item)
    )
    .sort(
      (a, b) =>
        new Date(a.comment.timestamp).getTime() -
        new Date(b.comment.timestamp).getTime()
    );

  for (const item of deliveryItems) {
    mix[item.category] += 1;
  }

  const buckets: { comment: Comment; category: WorkCategory }[][] = [];
  for (const item of deliveryItems) {
    const currentBucket = buckets[buckets.length - 1];
    if (!currentBucket) {
      buckets.push([item]);
      continue;
    }

    const prev = currentBucket[currentBucket.length - 1];
    const prevTime = new Date(prev.comment.timestamp).getTime();
    const currTime = new Date(item.comment.timestamp).getTime();
    const gapMs =
      Number.isFinite(prevTime) && Number.isFinite(currTime)
        ? currTime - prevTime
        : 0;

    if (prev.category === "deploy" || gapMs >= FOURTEEN_DAYS_MS) {
      buckets.push([item]);
    } else {
      currentBucket.push(item);
    }
  }

  const chronologicalWaves: DeliveryWave[] = buckets.map((bucket, idx) => {
    const counts: WorkMixCounts = {
      milestone: 0,
      deploy: 0,
      bug_fix: 0,
      status_update: 0,
    };
    for (const entry of bucket) {
      counts[entry.category] += 1;
    }

    const latestDeploy = [...bucket]
      .reverse()
      .find((e) => e.category === "deploy");
    const latestMilestone = [...bucket]
      .reverse()
      .find((e) => e.category === "milestone");
    const primary =
      latestDeploy ?? latestMilestone ?? bucket[bucket.length - 1];

    const keyItems = bucket.filter(
      (e) => e.category === "milestone" || e.category === "deploy"
    );
    const highlightSource =
      keyItems.length > 0 ? keyItems : [bucket[bucket.length - 1]];

    return {
      number: idx + 1,
      startDate: bucket[0].comment.timestamp,
      endDate: bucket[bucket.length - 1].comment.timestamp,
      counts,
      total: bucket.length,
      hasDeploy: counts.deploy > 0,
      headline: summarizeToSingleLine(primary.comment.message, 120),
      anchorCommentId: primary.comment.id,
      highlights: [...highlightSource].reverse().map((e) => ({
        id: e.comment.id,
        type: e.category,
        timestamp: e.comment.timestamp,
        summary: summarizeToSingleLine(e.comment.message, 150),
      })),
    };
  });

  const mode: ProjectWavesSummary["mode"] =
    projectStatus === "active"
      ? "active"
      : projectStatus === "paused"
      ? "paused"
      : chronologicalWaves.length > 1
      ? "iterative"
      : "single_completed";

  return {
    mix,
    totalDeliveryUpdates: deliveryItems.length,
    waves: chronologicalWaves.reverse(),
    mode,
  };
}
