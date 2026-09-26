/**
 * Supabase-backed project requests. Keeps the same async interface as lib/requests.ts
 * but reads/writes to PostgreSQL when configured. Gracefully falls back to JSON/memory
 * store when Supabase is not configured or when the `project_requests` table hasn't been
 * created yet.
 */
import { getSupabaseAdmin } from './supabase';
import type { ProjectRequest } from './types';
import {
  getRequestsByProject,
  createRequest,
  updateRequestStatus,
  submitRequestResponse,
} from './requests';

export async function getRequestsByProjectAsync(projectId: string): Promise<ProjectRequest[]> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return getRequestsByProject(projectId);
  }

  try {
    const { data, error } = await sb
      .from('project_requests')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[lib/requests-db] supabase error, falling back to local store:', error.message);
      return getRequestsByProject(projectId);
    }

    return (data ?? []) as ProjectRequest[];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[lib/requests-db] exception reading supabase, falling back:', message);
    return getRequestsByProject(projectId);
  }
}

export async function createRequestAsync(
  projectId: string,
  text: string
): Promise<{ ok: true; id: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const local = await createRequest(projectId, text);
    return { ok: true, id: local.id };
  }

  try {
    const { data, error } = await sb
      .from('project_requests')
      .insert({ project_id: projectId, text })
      .select('id')
      .single();

    if (error || !data) {
      console.warn(
        '[lib/requests-db] supabase insert error, falling back to local store:',
        error?.message
      );
      const local = await createRequest(projectId, text);
      return { ok: true, id: local.id };
    }

    return { ok: true, id: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[lib/requests-db] exception inserting to supabase, falling back:', message);
    const local = await createRequest(projectId, text);
    return { ok: true, id: local.id };
  }
}

export async function updateRequestStatusAsync(
  requestId: string,
  status: 'pending' | 'fulfilled'
): Promise<{ ok: true }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    await updateRequestStatus(requestId, status);
    return { ok: true };
  }

  try {
    const { error } = await sb
      .from('project_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.warn(
        '[lib/requests-db] supabase update error, falling back to local store:',
        error.message
      );
      await updateRequestStatus(requestId, status);
      return { ok: true };
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[lib/requests-db] exception updating supabase, falling back:', message);
    await updateRequestStatus(requestId, status);
    return { ok: true };
  }
}

export async function submitRequestResponseAsync(
  requestId: string,
  text: string
): Promise<{ ok: true }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    await submitRequestResponse(requestId, text);
    return { ok: true };
  }

  try {
    const { error } = await sb
      .from('project_requests')
      .update({
        response_text: text,
        responded_at: new Date().toISOString(),
        status: 'fulfilled',
      })
      .eq('id', requestId);

    if (error) {
      console.warn(
        '[lib/requests-db] supabase response error, falling back to local store:',
        error.message
      );
      await submitRequestResponse(requestId, text);
      return { ok: true };
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[lib/requests-db] exception updating response on supabase, falling back:', message);
    await submitRequestResponse(requestId, text);
    return { ok: true };
  }
}
