import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { ActiveProjects } from "@/components/sections/active-projects";
import { RecentUpdates } from "@/components/sections/recent-updates";
import { CompletedProjects } from "@/components/sections/completed-projects";
import { CTA } from "@/components/sections/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <ActiveProjects />
      <CompletedProjects />
      <RecentUpdates />
      <CTA />
    </>
  );
}