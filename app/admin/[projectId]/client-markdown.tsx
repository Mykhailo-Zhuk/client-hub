"use client";

/**
 * Client-side markdown renderer.
 *
 * Why this exists:
 *   The previous server-rendered comment-thread imported
 *   `renderSafeMarkdown` from `@/lib/sanitize`, which pulls in
 *   `isomorphic-dompurify` → `jsdom` at import time. On Vercel's
 *   serverless runtime, loading `jsdom` during a server-component
 *   render fails and surfaces as a generic `/500` before the route's
 *   try/catch or error.tsx can run.
 *
 *   Moving the rendering to a client component keeps `jsdom` off the
 *   server render path entirely — DOMPurify on the client uses the
 *   browser, and `marked.parse` works the same in both environments.
 *
 * Keeping the surface API tiny (`content: string`) so we can drop it in
 * anywhere a plain string of markdown needs to become safe HTML.
 */
import { useMemo } from "react";
import { renderSafeMarkdown } from "@/lib/sanitize";

export default function ClientMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const html = useMemo(() => renderSafeMarkdown(content ?? ""), [content]);
  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
