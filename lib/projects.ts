import projectsData from "@/data/projects.json";
import type { Project } from "./types";

const SAMPLE_PROJECT_IDS = new Set([
  "spa-canada",
  "iron-master",
  "universal-service-template",
]);

/** Return true when a project is an open sample showcase. */
export function isSampleProject(
  project: Pick<Project, "id" | "isSample">
): boolean {
  return Boolean(project.isSample || SAMPLE_PROJECT_IDS.has(project.id));
}

/** Return a copy of `projects` with sample projects placed first, preserving relative order. */
export function sortSamplesFirst<T extends Pick<Project, "id" | "isSample">>(
  projects: T[]
): T[] {
  return [...projects].sort(
    (a, b) => Number(isSampleProject(b)) - Number(isSampleProject(a))
  );
}

export function getAllProjects(): Project[] {
  return sortSamplesFirst(projectsData as Project[]);
}

export function getActiveProjects(): Project[] {
  return getAllProjects().filter((p) => p.status === "active");
}

export function getCompletedProjects(): Project[] {
  return getAllProjects().filter((p) => p.status === "completed");
}

export function getProjectById(id: string): Project | undefined {
  return getAllProjects().find(
    (p) =>
      p.id === id ||
      (id === "universal-service-template" && p.id === "iron-master") ||
      (id === "iron-master" && p.id === "universal-service-template")
  );
}

function getProjectsByEmail(email: string): Project[] {
  return getAllProjects().filter(
    (p) => p.clientEmail?.toLowerCase() === email.toLowerCase()
  );
}