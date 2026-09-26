"use client";

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
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
