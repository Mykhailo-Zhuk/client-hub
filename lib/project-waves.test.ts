import { describe, expect, it } from "vitest";
import { buildProjectWaves } from "./project-waves";
import type { Comment } from "./types";

function makeComment(
  id: string,
  type: Comment["type"],
  timestamp: string,
  message = `Message ${id}`
): Comment {
  return {
    id,
    projectId: "demo",
    type,
    message,
    author: "Mykhailo Zhuk",
    timestamp,
  };
}

describe("buildProjectWaves", () => {
  it("excludes client_reply and feedback from work mix and groups waves by deploy and 14d gap", () => {
    const comments: Comment[] = [
      makeComment("c1", "status_update", "2025-03-23T12:00:00Z", "Init layout"),
      makeComment("c2", "milestone", "2025-03-29T16:00:00Z", "Franchise blocks"),
      makeComment("c-reply", "client_reply", "2025-04-01T10:00:00Z", "Looks great!"),
      makeComment("c3", "deploy", "2025-04-05T18:00:00Z", "Release v1"),
      // Closed by deploy -> wave 2
      makeComment("c4", "milestone", "2025-04-08T10:00:00Z", "De Massage page"),
      // 30+ day gap -> wave 3
      makeComment("c5", "bug_fix", "2025-06-15T12:00:00Z", "Fix SSR hydration"),
    ];

    const summary = buildProjectWaves(comments, "completed");

    expect(summary.totalDeliveryUpdates).toBe(5);
    expect(summary.mix).toEqual({
      milestone: 2,
      deploy: 1,
      bug_fix: 1,
      status_update: 1,
    });
    expect(summary.mode).toBe("iterative");
    expect(summary.waves).toHaveLength(3);
    // Newest wave first
    expect(summary.waves[0].number).toBe(3);
    expect(summary.waves[0].headline).toBe("Fix SSR hydration");
    expect(summary.waves[1].number).toBe(2);
    expect(summary.waves[2].number).toBe(1);
    expect(summary.waves[2].hasDeploy).toBe(true);
    expect(summary.waves[2].headline).toBe("Release v1");
  });

  it("handles empty comment lists gracefully", () => {
    const summary = buildProjectWaves([], "active");
    expect(summary.totalDeliveryUpdates).toBe(0);
    expect(summary.waves).toEqual([]);
    expect(summary.mode).toBe("active");
  });
});
