import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "../ui/reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-[0.12] dark:opacity-[0.18]" />
      <div className="absolute inset-0 -z-10 bg-grid-pattern" />
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <Reveal>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles size={12} className="text-accent" />
            Public build · MVP
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Track your project{" "}
            <span className="bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent">
              in real-time
            </span>
            .
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Public dashboard with active work, per-client portal with magic-link
            access, and Telegram notifications when something ships. No noise.
            Just progress.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm hover:opacity-90"
            >
              Choose your project <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}