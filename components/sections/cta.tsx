"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Reveal } from "../ui/reveal";
import { useLanguage } from "@/lib/i18n/context";

export function CTA() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-background to-purple-500/10 p-8 text-center sm:p-12">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            {t("cta.description")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:hello@zhuk.dev"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              <Mail size={14} /> {t("cta.getInTouch")}
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              {t("cta.openPortal")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}