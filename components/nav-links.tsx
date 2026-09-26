"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

export function NavLinks({ isAuthed }: { isAuthed: boolean }) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Link
        href="/admin"
        className="hidden rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-block"
      >
        {t("nav.admin")}
      </Link>
      <a
        href="https://github.com/Mykhailo-Zhuk/client-hub"
        target="_blank"
        rel="noreferrer"
        className="hidden rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-block"
      >
        <Github size={14} className="mr-1 inline" />
        {t("nav.repo")}
      </a>
      {isAuthed ? (
        <Link
          href="/login"
          className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {t("nav.portal")}
        </Link>
      ) : (
        <Link
          href="/login"
          className="rounded-md bg-accent px-3 py-1.5 text-accent-foreground hover:opacity-90"
        >
          {t("nav.login")}
        </Link>
      )}
      <LanguageToggle className="ml-1" />
      <ThemeToggle />
    </div>
  );
}
