import projectsData from "@/data/projects.json";
import type { Project } from "./types";

export function getAllProjects(): Project[] {
  return projectsData as Project[];
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