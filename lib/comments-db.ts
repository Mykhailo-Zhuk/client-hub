/**
 * Supabase-backed comments. Keeps the same async surface as lib/comments.ts
 * but writes/reads to PostgreSQL when configured. Falls back to JSON
 * (in-memory) store when Supabase is not yet wired so dev never breaks.
 */
import { getSupabaseAdmin } from './supabase';
import type { Comment, CommentType } from './types';

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
  const { data, error } = await sb
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: false });
  if (error) {
    console.warn('[lib/comments-db] supabase error:', error.message);
    const { getCommentsByProject } = await import('./comments');
    return getCommentsByProject(projectId);
  }
  return (data ?? []).map(rowToComment);
}

export async function getRecentCommentsAsync(limit = 5): Promise<Comment[]> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    const { getRecentComments } = await import('./comments');
    return getRecentComments(limit);
  }
  const { data, error } = await sb
    .from('comments')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[lib/comments-db] supabase error:', error.message);
    const { getRecentComments } = await import('./comments');
    return getRecentComments(limit);
  }
  return (data ?? []).map(rowToComment);
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