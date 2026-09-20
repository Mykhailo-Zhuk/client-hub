/**
 * Supabase-backed project/comment reads.
 *
 * Backwards-compatible with existing call-sites: `getAllProjects()` etc.
 * returned synchronous Project[]; Supabase calls are async. We provide
 * async variants and a tiny in-memory cache so the existing synchronous
 * helpers (`getAllProjects`, `getProjectById`, `getProjectsByEmail`)
 * continue to work as a JSON fallback when Supabase is not configured
 * or the migration hasn't been run yet.
 *
 * Once the migration is applied + env vars are set, all callers can
 * migrate to `getProjectsAsync()` / `getProjectByIdAsync()`.
 */
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import projectsData from '@/data/projects.json';
import type { Project } from './types';

type SupabaseProjectRow = {
  id: string;
  client_name: string;
  client_email: string;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  day_current: number;
  day_total: number;
  start_date: string | null;
  estimated_end: string | null;
  completed_date: string | null;
  tags: string[] | null;
  github: string | null;
  demo: string | null;
  cover: string | null;
};

function rowToProject(r: SupabaseProjectRow): Project {
  return {
    id: r.id,
    client: r.client_name,
    clientEmail: r.client_email,
    title: r.title,
    description: r.description ?? undefined,
    status: r.status,
    progress: r.progress,
    dayCurrent: r.day_current || undefined,
    dayTotal: r.day_total || undefined,
    startDate: r.start_date ?? '',
    estimatedEnd: r.estimated_end ?? undefined,
    completedDate: r.completed_date ?? undefined,
    tags: r.tags ?? [],
    github: r.github ?? undefined,
    demo: r.demo ?? undefined,
    cover: r.cover ?? undefined,
  };
}

// ---------- synchronous JSON fallback (legacy) ----------
const JSON_PROJECTS = projectsData as Project[];

export function getAllProjects(): Project[] {
  return JSON_PROJECTS;
}
export function getActiveProjects(): Project[] {
  return getAllProjects().filter((p) => p.status === 'active');
}
export function getCompletedProjects(): Project[] {
  return getAllProjects().filter((p) => p.status === 'completed');
}
export function getProjectById(id: string): Project | undefined {
  return getAllProjects().find((p) => p.id === id);
}
export function getProjectsByEmail(email: string): Project[] {
  return getAllProjects().filter(
    (p) => p.clientEmail?.toLowerCase() === email.toLowerCase()
  );
}

// ---------- async Supabase-backed helpers ----------
export async function getProjectsAsync(): Promise<Project[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return JSON_PROJECTS;
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[lib/projects-db] supabase error, falling back to JSON:', error.message);
    return JSON_PROJECTS;
  }
  return (data ?? []).map((r) => rowToProject(r as SupabaseProjectRow));
}

export async function getProjectByIdAsync(id: string): Promise<Project | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return getProjectById(id) ?? null;
  const { data, error } = await sb.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.warn('[lib/projects-db] supabase error:', error.message);
    return getProjectById(id) ?? null;
  }
  return data ? rowToProject(data as SupabaseProjectRow) : null;
}

export async function getProjectsByEmailAsync(email: string): Promise<Project[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return getProjectsByEmail(email);
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .ilike('client_email', email)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[lib/projects-db] supabase error:', error.message);
    return getProjectsByEmail(email);
  }
  return (data ?? []).map((r) => rowToProject(r as SupabaseProjectRow));
}

export async function updateProjectProgress(
  id: string,
  progress: number
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('projects').update({ progress }).eq('id', id);
}

export async function updateProjectStatus(
  id: string,
  status: 'active' | 'completed' | 'paused'
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from('projects').update({ status }).eq('id', id);
}

export { isSupabaseConfigured };