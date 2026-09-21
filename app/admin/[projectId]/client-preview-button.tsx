"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";

/**
 * Admin "Preview as client" button.
 *
 * Calls /api/portal/preview to mint a magic-link JWT for the given
 * projectId, then navigates the browser to /portal/[id]?token=...
 * so the agent sees exactly what the client sees (their own email,
 * their own comments, their own permissions).
 */
export function ClientPreviewButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data?.magicLink) {
        throw new Error("Server returned no magicLink");
      }
      // Hard navigate so the portal page picks up ?token= in the URL
      // (cookies are unreliable on Vercel serverless; URL is source of truth).
      window.location.href = data.magicLink;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Preview failed";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-60"
        title="Preview the portal as this client (admin only)"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Eye size={12} />
        )}
        Client view →
      </button>
      {error ? (
        <span className="text-[10px] text-red-500">{error}</span>
      ) : null}
    </div>
  );
}
