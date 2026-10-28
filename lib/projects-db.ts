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
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  recordSupabaseError,
  clearSupabaseError,
} from './supabase';
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
  client_password?: string | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  client_telegram_token?: string | null;
  client_telegram_chat_id?: string | null;
};

function rowToProject(r: SupabaseProjectRow): Project {
  const jsonFallback = (projectsData as Project[]).find((p) => p.id === r.id);
  const useJsonProgress = Boolean(
    jsonFallback && typeof jsonFallback.progress === 'number' && jsonFallback.progress > r.progress
  );
  return {
    id: r.id,
    client: r.client_name,
    clientEmail: r.client_email,
    clientPassword: r.client_password ?? undefined,
    title: r.title,
    description: r.description ?? undefined,
    status: r.status,
    progress: useJsonProgress && jsonFallback ? jsonFallback.progress : r.progress,
    dayCurrent:
      (useJsonProgress && jsonFallback ? jsonFallback.dayCurrent : r.day_current) || undefined,
    dayTotal:
      (useJsonProgress && jsonFallback ? jsonFallback.dayTotal : r.day_total) || undefined,
    startDate: r.start_date ?? '',
    estimatedEnd: r.estimated_end ?? undefined,
    completedDate: r.completed_date ?? undefined,
    tags: r.tags ?? [],
    github: r.github ?? undefined,
    demo: r.demo ?? undefined,
    cover: r.cover ?? undefined,
    telegramBotToken: r.telegram_bot_token ?? jsonFallback?.telegramBotToken ?? undefined,
    telegramChatId: r.telegram_chat_id ?? jsonFallback?.telegramChatId ?? undefined,
    clientTelegramToken: r.client_telegram_token ?? jsonFallback?.clientTelegramToken ?? undefined,
    clientTelegramChatId: r.client_telegram_chat_id ?? jsonFallback?.clientTelegramChatId ?? undefined,
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
  try {
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      recordSupabaseError(error.message);
      console.warn('[lib/projects-db] supabase error, falling back to JSON:', error.message);
      return JSON_PROJECTS;
    }
    clearSupabaseError();
    const sbProjects = (data ?? []).map((r) => rowToProject(r as SupabaseProjectRow));
    const sbIds = new Set(sbProjects.map((p) => p.id));
    const missingFromJson = JSON_PROJECTS.filter((p) => !sbIds.has(p.id));

    if (missingFromJson.length > 0) {
      // Fire-and-forget sync to Supabase so missing projects are saved to PostgreSQL
      syncProjectsToSupabase(missingFromJson).catch((err) =>
        console.warn('[lib/projects-db] auto-sync projects to supabase error:', err)
      );
      return [...sbProjects, ...missingFromJson];
    }

    return sbProjects;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    recordSupabaseError(msg);
    console.warn('[lib/projects-db] supabase exception, falling back to JSON:', msg);
    return JSON_PROJECTS;
  }
}

export async function syncProjectsToSupabase(
  projectsToSync: Project[] = JSON_PROJECTS
): Promise<{ synced: number }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { synced: 0 };

  let count = 0;
  for (const p of projectsToSync) {
    try {
      const row: Record<string, unknown> = {
        id: p.id,
        client_name: p.client,
        client_email: p.clientEmail || `contact@${p.id}.example`,
        title: p.title,
        description: p.description ?? null,
        status: p.status,
        progress: p.progress,
        day_current: p.dayCurrent ?? 0,
        day_total: p.dayTotal ?? 0,
        start_date: p.startDate || null,
        estimated_end: p.estimatedEnd ?? null,
        completed_date: p.completedDate ?? null,
        tags: p.tags ?? [],
        github: p.github ?? null,
        demo: p.demo ?? null,
        cover: p.cover ?? null,
      };
      if (p.clientPassword) row.client_password = p.clientPassword;
      if (p.telegramBotToken) row.telegram_bot_token = p.telegramBotToken;
      if (p.telegramChatId) row.telegram_chat_id = p.telegramChatId;
      if (p.clientTelegramToken) row.client_telegram_token = p.clientTelegramToken;
      if (p.clientTelegramChatId) row.client_telegram_chat_id = p.clientTelegramChatId;

      const { error } = await sb.from('projects').upsert(row, { onConflict: 'id' });
      if (!error) {
        count++;
      } else {
        console.warn(`[lib/projects-db] sync project ${p.id} error:`, error.message);
      }
    } catch (err: any) {
      console.warn(`[lib/projects-db] sync project ${p.id} exception:`, err?.message);
    }
  }
  return { synced: count };
}

export async function getProjectByIdAsync(id: string): Promise<Project | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return getProjectById(id) ?? null;
  try {
    const { data, error } = await sb.from('projects').select('*').eq('id', id).maybeSingle();
    if (error) {
      recordSupabaseError(error.message);
      console.warn('[lib/projects-db] supabase error:', error.message);
      return getProjectById(id) ?? null;
    }
    clearSupabaseError();
    return data ? rowToProject(data as SupabaseProjectRow) : (getProjectById(id) ?? null);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    recordSupabaseError(msg);
    console.warn('[lib/projects-db] supabase exception:', msg);
    return getProjectById(id) ?? null;
  }
}

export async function getProjectsByEmailAsync(email: string): Promise<Project[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return getProjectsByEmail(email);
  try {
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .ilike('client_email', email)
      .order('created_at', { ascending: false });
    if (error) {
      recordSupabaseError(error.message);
      console.warn('[lib/projects-db] supabase error:', error.message);
      return getProjectsByEmail(email);
    }
    clearSupabaseError();
    return (data ?? []).map((r) => rowToProject(r as SupabaseProjectRow));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    recordSupabaseError(msg);
    console.warn('[lib/projects-db] supabase exception:', msg);
    return getProjectsByEmail(email);
  }
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

/**
 * Insert a new project row. Throws if `id` already exists or Supabase rejects it.
 * Returns the inserted id on success.
 */
export async function createProject(
  row: Omit<SupabaseProjectRow, 'completed_date' | 'created_at' | 'updated_at'>
): Promise<string> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    throw new Error('Supabase is not configured — cannot create project.');
  }
  const { data: existing, error: selErr } = await sb
    .from('projects')
    .select('id')
    .eq('id', row.id)
    .maybeSingle();
  if (selErr) {
    throw new Error(`Lookup failed: ${selErr.message}`);
  }
  if (existing) {
    throw new Error(`Project with id "${row.id}" already exists`);
  }
  const { error } = await sb.from('projects').insert(row);
  if (error) {
    throw new Error(error.message);
  }
  return row.id;
}

/**
 * Delete a project by id. Also cascades comments (FK on delete cascade).
 */
export async function deleteProject(id: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    throw new Error('Supabase is not configured — cannot delete project.');
  }
  const { error } = await sb.from('projects').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export { isSupabaseConfigured };