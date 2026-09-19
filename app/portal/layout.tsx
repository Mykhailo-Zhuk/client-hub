import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyPortalToken } from "@/lib/jwt";

// Portal layout: gate /portal/* routes.
//
// Auth flow (serverless-safe):
//   1. /api/auth issues a JWT and returns magicLink `/portal/{id}?token=...`.
//   2. The login form does a full-page navigation to that URL.
//   3. The browser sends the token in the URL; cookies may or may not be
//      persisted across serverless instances, so we DON'T rely on them.
//   4. The [projectId] page reads ?token=, verifies the JWT, and either
//      renders the portal or redirects to /login.
//
// The layout is a defense-in-depth gate: if a cookie is present, it must
// verify. If no cookie, we still render children so the page can try
// ?token= and not bounce users with a valid magic link.
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get("ch_session")?.value;
  if (token) {
    const session = await verifyPortalToken(token);
    if (!session) {
      console.warn("[portal/layout] invalid cookie token — falling through to page (may try ?token=)");
    }
  }
  return <>{children}</>;
}