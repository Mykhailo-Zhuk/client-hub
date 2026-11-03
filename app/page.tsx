import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { ActiveProjects } from "@/components/sections/active-projects";
import { RecentUpdates } from "@/components/sections/recent-updates";
import { CompletedProjects } from "@/components/sections/completed-projects";
import { CTA } from "@/components/sections/cta";
import { getProjectsAsync } from "@/lib/projects-db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const projects = await getProjectsAsync();
    const activeProjects = projects.filter((p) => p.status === "active");
    const completedProjects = projects.filter((p) => p.status === "completed");

    return (
      <>
        <Hero />
        <Stats activeProjectsCount={activeProjects.length} />
        <ActiveProjects projects={activeProjects} />
        <CompletedProjects projects={completedProjects} />
        <RecentUpdates />
        <CTA />
      </>
    );
  } catch (err: any) {
    console.error("[HomePage render error]:", err);
    return (
      <div className="mx-auto max-w-4xl my-12 p-6 rounded-lg border border-red-500/40 bg-red-950/20 text-red-400 font-mono text-xs">
        <h1 className="text-base font-bold text-red-500 mb-2">HomePage Server Render Error</h1>
        <p className="mb-2 font-semibold">{err?.name}: {err?.message}</p>
        <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] bg-black/40 p-3 rounded">{err?.stack || String(err)}</pre>
      </div>
    );
  }
}