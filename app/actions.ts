'use server';

/**
 * Server Actions for admin operations.
 *
 * These bypass `/api/comments` so admin writes NEVER touch the cookie-based
 * portal auth path (which caused "Token does not match project" when a stale
 * `ch_session` cookie was sent while posting on a different project).
 *
 * They run with the Supabase service_role key, which skips RLS by design —
 * exactly what we want for the authenticated admin UI.
 */

import { requireSupabaseAdmin } from '@/lib/supabase';
import type { CommentType } from '@/lib/types';
import {
  createRequestAsync,
  updateRequestStatusAsync,
  submitRequestResponseAsync,
} from '@/lib/requests-db';

// Admin UI sends 'update'; it isn't a CommentType so we map → 'general' below.
const ADMIN_TYPE_ALIASES: Record<string, CommentType> = {
  update: 'status_update',
  milestone: 'milestone',
  deploy: 'deploy',
  bug_fix: 'bug_fix',
  general: 'general',
};

function resolveCommentType(raw: string | undefined): CommentType {
  const t = (raw ?? '').toString().trim();
  if (!t) return 'general';
  if (t in ADMIN_TYPE_ALIASES) return ADMIN_TYPE_ALIASES[t];
  if (
    t === 'status_update' ||
    t === 'milestone' ||
    t === 'bug_fix' ||
    t === 'deploy' ||
    t === 'general' ||
    t === 'feedback' ||
    t === 'client_reply'
  ) {
    return t;
  }
  return 'general';
}

export interface CreateCommentInput {
  projectId: string;
  message: string;
  type?: string;
  author?: string;
}

export interface CreateCommentResult {
  ok: true;
  id: string;
  backend: 'supabase' | 'json';
}

export async function createCommentAction(
  input: CreateCommentInput
): Promise<CreateCommentResult> {
  const projectId = String(input.projectId ?? '').trim();
  const rawMessage = String(input.message ?? '');
  const message = rawMessage.trim();

  if (!projectId) {
    throw new Error('projectId required');
  }
  if (!message) {
    throw new Error('message required');
  }
  if (message.length > 5000) {
    throw new Error('message too long (max 5000 chars)');
  }

  const type = resolveCommentType(input.type);
  const author = (input.author || 'Agent').toString().trim() || 'Agent';

  // Prefer Supabase (service_role bypasses RLS). Fall back to JSON store
  // so dev / first-run works even without Supabase wired.
  const sb = requireSupabaseAdmin();
  const { data, error } = await sb
    .from('comments')
    .insert({
      project_id: projectId,
      type,
      message,
      author,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'supabase insert failed');
  }

  return { ok: true, id: data.id as string, backend: 'supabase' };
}

export interface CreateProjectInput {
  id?: string;
  clientName: string;
  clientEmail?: string;
  title: string;
  description?: string;
  status?: 'active' | 'completed' | 'paused';
  progress?: number;
  dayCurrent?: number;
  dayTotal?: number;
  startDate?: string;
}

export async function createProjectAction(
  input: CreateProjectInput
): Promise<{ ok: true; id: string; backend: 'supabase' | 'json' }> {
  const clientName = String(input.clientName ?? '').trim();
  const title = String(input.title ?? '').trim();
  if (!clientName) throw new Error('clientName required');
  if (!title) throw new Error('title required');

  const id =
    input.id?.toString().trim() ||
    `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const sb = requireSupabaseAdmin();
  const { error } = await sb.from('projects').insert({
    id,
    client_name: clientName,
    client_email: input.clientEmail?.toString().trim() || null,
    title,
    description: input.description?.toString().trim() || null,
    status: input.status ?? 'active',
    progress: Number(input.progress ?? 0),
    day_current: Number(input.dayCurrent ?? 0),
    day_total: Number(input.dayTotal ?? 0),
    start_date: input.startDate?.toString().trim() || null,
  });

  if (error) {
    throw new Error(`project insert failed: ${error.message}`);
  }

  return { ok: true, id, backend: 'supabase' };
}

export interface CreateRequestInput {
  projectId: string;
  text: string;
}

export async function createRequestAction(input: CreateRequestInput): Promise<{ ok: true; id: string }> {
  const { projectId, text } = input;
  if (!projectId || !text) throw new Error('projectId and text are required');

  return createRequestAsync(projectId, text);
}

export async function updateRequestStatusAction(requestId: string, status: 'pending' | 'fulfilled'): Promise<{ ok: true }> {
  if (!requestId) throw new Error('requestId required');

  return updateRequestStatusAsync(requestId, status);
}

export async function submitRequestResponseAction(requestId: string, text: string): Promise<{ ok: true }> {
  if (!requestId) throw new Error('requestId required');
  if (!text) throw new Error('response text is required');

  return submitRequestResponseAsync(requestId, text);
}

