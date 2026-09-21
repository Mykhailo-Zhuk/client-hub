import { redirect } from 'next/navigation';

/**
 * /agent-console has been merged into /admin/[projectId].
 * Visiting this URL now redirects to /admin so any old bookmarks
 * still land on a working page.
 */
export default function AgentConsolePage(): never {
  redirect('/admin');
}
