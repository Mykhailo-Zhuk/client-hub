/**
 * Supabase-backed comments. Keeps the same async surface as lib/comments.ts
 * but writes/reads to PostgreSQL when configured. Falls back to JSON
 * (in-memory) store when Supabase is not yet wired so dev never breaks.
 */
import { getSupabaseAdmin, recordSupabaseError } from './supabase';
import type { Comment, CommentType } from './types';
import commentsData from '@/data/comments.json';

type SupabaseCommentRow = {
  id: string;
  project_id: string;
  type: string;
  message: string;
  author: string;
  timestamp: string;
};

function rowToComment(r: SupabaseCommentRow): Comment {
  return {
    id: r.id,
    projectId: r.project_id,
    type: (r.type as CommentType) ?? 'general',
    message: r.message,
    author: r.author,
    timestamp: r.timestamp,
  };
}

export async function getCommentsByProjectAsync(projectId: string): Promise<Comment[]> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const { getCommentsByProject } = await import('./comments');
    return getCommentsByProject(projectId);
  }
  try {
    const { data, error } = await sb
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false });
    if (error) {
      recordSupabaseError(error.message);
      console.warn('[lib/comments-db] supabase error:', error.message);
      const { getCommentsByProject } = await import('./comments');
      return getCommentsByProject(projectId);
    }

    const sbComments = (data ?? []).map(rowToComment);
    if (sbComments.length === 0) {
      const { getCommentsByProject } = await import('./comments');
      const jsonComments = await getCommentsByProject(projectId);
      if (jsonComments.length > 0) {
        syncCommentsToSupabase(jsonComments).catch(() => {});
      }
      return jsonComments;
    }

    return sbComments;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    recordSupabaseError(msg);
    console.warn('[lib/comments-db] supabase exception:', msg);
    const { getCommentsByProject } = await import('./comments');
    return getCommentsByProject(projectId);
  }
}

export async function getRecentCommentsAsync(limit = 10): Promise<Comment[]> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const { getRecentComments } = await import('./comments');
    return getRecentComments(limit);
  }
  try {
    const { data, error } = await sb
      .from('comments')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) {
      recordSupabaseError(error.message);
      console.warn('[lib/comments-db] supabase error:', error.message);
      const { getRecentComments } = await import('./comments');
      return getRecentComments(limit);
    }
    const sbComments = (data ?? []).map(rowToComment);
    const { getRecentComments } = await import('./comments');
    const jsonComments = await getRecentComments(limit * 2);

    const combined = [...sbComments];
    for (const jc of jsonComments) {
      if (!combined.some((c) => c.projectId === jc.projectId && c.message === jc.message)) {
        combined.push(jc);
      }
    }
    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return combined.slice(0, limit);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    recordSupabaseError(msg);
    console.warn('[lib/comments-db] supabase exception:', msg);
    const { getRecentComments } = await import('./comments');
    return getRecentComments(limit);
  }
}

export async function syncCommentsToSupabase(
  commentsToSync?: Comment[]
): Promise<{ synced: number }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { synced: 0 };
  const list = commentsToSync ?? (commentsData as Comment[]);
  let count = 0;
  for (const c of list) {
    try {
      // Check if comment already exists for this project with matching message
      const { data: existing } = await sb
        .from('comments')
        .select('id')
        .eq('project_id', c.projectId)
        .eq('message', c.message)
        .maybeSingle();

      if (!existing) {
        const { error } = await sb.from('comments').insert({
          project_id: c.projectId,
          type: c.type,
          message: c.message,
          author: c.author,
          timestamp: c.timestamp,
        });
        if (!error) count++;
      }
    } catch {
      // Ignore
    }
  }
  return { synced: count };
}

export async function addCommentAsync(input: {
  projectId: string;
  type: CommentType;
  message: string;
  author: string;
}): Promise<Comment> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const { addComment } = await import('./comments');
    return addComment(input);
  }
  const { data, error } = await sb
    .from('comments')
    .insert({
      project_id: input.projectId,
      type: input.type,
      message: input.message,
      author: input.author,
    })
    .select()
    .single();
  if (error) throw new Error(`supabase insert failed: ${error.message}`);
  return rowToComment(data as SupabaseCommentRow);
}