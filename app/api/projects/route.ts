import { NextResponse } from "next/server";
import {
  getAllProjects,
  getActiveProjects,
  getCompletedProjects,
  getProjectById,
} from "@/lib/projects";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const status = url.searchParams.get("status");

  if (id) {
    const project = getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  }

  if (status === "active") {
    return NextResponse.json({ projects: getActiveProjects() });
  }
  if (status === "completed") {
    return NextResponse.json({ projects: getCompletedProjects() });
  }

  return NextResponse.json({ projects: getAllProjects() });
}