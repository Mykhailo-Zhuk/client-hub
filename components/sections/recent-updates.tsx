import { getRecentCommentsAsync } from "@/lib/comments-db";
import { RecentUpdatesList } from "./recent-updates-list";

export async function RecentUpdates() {
  const comments = await getRecentCommentsAsync(5);
  return <RecentUpdatesList comments={comments} />;
}