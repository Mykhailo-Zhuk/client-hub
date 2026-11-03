import { getRecentCommentsAsync } from "@/lib/comments-db";
import { RecentUpdatesList } from "./recent-updates-list";

export async function RecentUpdates() {
  try {
    const comments = await getRecentCommentsAsync(5);
    return <RecentUpdatesList comments={comments} />;
  } catch (err: any) {
    console.error("[RecentUpdates render error]:", err);
    return (
      <div className="mx-auto max-w-6xl my-8 p-4 rounded border border-amber-500/40 bg-amber-950/20 text-amber-400 font-mono text-xs">
        RecentUpdates error: {err?.message}
      </div>
    );
  }
}