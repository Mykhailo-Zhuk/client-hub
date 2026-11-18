"use client";

import { ShieldAlert, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

/**
 * Top-of-portal notice encouraging clients still on the default password
 * to switch to a stronger custom password in the Settings tab.
 */
export function DefaultPasswordBanner() {
  const { t } = useLanguage();

  function openSettings() {
    window.dispatchEvent(new CustomEvent("portal:open-settings"));
    document.getElementById("portal-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert
          size={20}
          className="mt-0.5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400"
        />
        <div>
          <div className="font-semibold">
            {t("portal.defaultPasswordWarning.title")}
          </div>
          <p className="mt-0.5 text-xs text-amber-900/90 dark:text-amber-300/90">
            {t("portal.defaultPasswordWarning.description")}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={openSettings}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-md border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-950 transition-colors hover:bg-amber-500/30 dark:text-amber-100 sm:self-center"
      >
        <span>{t("portal.defaultPasswordWarning.cta")}</span>
        <ArrowRight size={12} />
      </button>
    </div>
  );
}
