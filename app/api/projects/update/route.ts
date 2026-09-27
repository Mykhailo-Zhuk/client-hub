import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { AGENT_SECRET, AGENT_COOKIE } from '@/lib/agent-auth';
import { updateClientEmail, setClientPassword } from '@/lib/client-passwords';
import fs from 'fs';
import path from 'path';
import type { Project } from '@/lib/types';

const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');

function updateJsonProjects(projectId: string, updates: Record<string, unknown>) {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return;
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    const projects: Project[] = JSON.parse(raw);
    const target = projects.find((p) => p.id === projectId);
    if (target) {
      if (typeof updates.title === 'string') target.title = updates.title;
      if (typeof updates.client_name === 'string') target.client = updates.client_name;
      if (typeof updates.client_email === 'string') target.clientEmail = updates.client_email;
      if (typeof updates.status === 'string') target.status = updates.status as any;
      if (typeof updates.progress === 'number') target.progress = updates.progress;
      if (typeof updates.day_current === 'number') target.dayCurrent = updates.day_current;
      if (typeof updates.day_total === 'number') target.dayTotal = updates.day_total;
      if (typeof updates.demo === 'string') target.demo = updates.demo;
      if (typeof updates.github === 'string') target.github = updates.github;
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[api/projects/update] error updating projects.json:', err);
  }
}

/**
 * PATCH/POST endpoint for updating project state from the admin panel.
 * Gated by the agent cookie (same as /admin/layout).
 */
export async function POST(req: NextRequest) {
  const agentToken = (await cookies()).get(AGENT_COOKIE)?.value;
  if (agentToken !== AGENT_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      projectId,
      title,
      client_name,
      client_email,
      client_password,
      progress,
      status,
      day_current,
      day_total,
      demo,
      github,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof title === 'string') updates.title = title;
    if (typeof client_name === 'string') updates.client_name = client_name;
    if (typeof client_email === 'string') updates.client_email = client_email;
    if (typeof progress === 'number') updates.progress = progress;
    if (['active', 'completed', 'paused'].includes(status)) updates.status = status;
    if (typeof day_current === 'number') updates.day_current = day_current;
    if (typeof day_total === 'number') updates.day_total = day_total;
    if (demo !== undefined) updates.demo = demo;
    if (github !== undefined) updates.github = github;

    // Handle password update if specified
    if (typeof client_password === 'string' && client_password.trim()) {
      await setClientPassword(projectId, client_password.trim());
    }

    // Always update JSON fallback
    updateJsonProjects(projectId, updates);

    // Update Supabase if configured
    if (isSupabaseConfigured() && Object.keys(updates).length > 0) {
      const sb = requireSupabaseAdmin();
      const { error } = await sb.from('projects').update(updates).eq('id', projectId);
      if (error) {
        console.warn('[api/projects/update] Supabase error:', error.message);
      }
    }

    return NextResponse.json({ ok: true, projectId, updates });
  } catch (e: any) {
    console.error('[api/projects/update] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}