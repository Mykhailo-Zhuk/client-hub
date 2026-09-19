import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Reveal } from "../ui/reveal";

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/10 via-background to-purple-500/10 p-8 text-center sm:p-12">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Have a project? Let&apos;s talk.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Web app, landing page, internal tool — we ship MVPs in days, not
            months. Get a public build link, real-time progress, and weekly
            updates.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:hello@zhuk.dev"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              <Mail size={14} /> Get in touch
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Open portal <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}