"use client";

import { useLanguage } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/60 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
        <div>
          © {new Date().getFullYear()} Client Hub · {t("footer.builtBy")}{" "}
          <a
            href="https://zhuk.dev"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Mykhailo Zhuk
          </a>
        </div>
        <div className="flex gap-4">
          <a href="/admin" className="hover:text-foreground">
            {t("footer.admin")}
          </a>
          <a href="/login" className="hover:text-foreground">
            {t("footer.clientLogin")}
          </a>
        </div>
      </div>
    </footer>
  );
}