import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { ActiveProjects } from "@/components/sections/active-projects";
import { RecentUpdates } from "@/components/sections/recent-updates";
import { CompletedProjects } from "@/components/sections/completed-projects";
import { CTA } from "@/components/sections/cta";
import { getProjectsAsync } from "@/lib/projects-db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
}