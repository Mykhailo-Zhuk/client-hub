import { getRecentComments } from "@/lib/comments";
import { RecentUpdatesList } from "./recent-updates-list";

export async function RecentUpdates() {
  const comments = await getRecentComments(5);
  return <RecentUpdatesList comments={comments} />;
}