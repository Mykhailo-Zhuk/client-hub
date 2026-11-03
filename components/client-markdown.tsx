"use client";

import { useMemo, useState, useEffect } from "react";
import { renderSafeMarkdown } from "@/lib/sanitize";

export default function ClientMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const html = useMemo(() => renderSafeMarkdown(content ?? ""), [content]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
