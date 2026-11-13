import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { AGENT_SECRET, AGENT_COOKIE } from '@/lib/agent-auth';
import { setClientPassword, updateProjectsJson } from '@/lib/client-passwords';
import { computeEffectiveDayCurrent } from '@/lib/project-days';

async function updateSupabaseProject(
  sb: SupabaseClient,
  projectId: string,
  updates: Record<string, unknown>
): Promise<{ error: { message: string; code?: string } | null }> {
  const pending = { ...updates };
  const maxAttempts = Object.keys(pending).length + 1;

  for (let i = 0; i < maxAttempts && Object.keys(pending).length > 0; i++) {
    const { error } = await sb.from('projects').update(pending).eq('id', projectId);
    if (!error) return { error: null };

    // If an unmigrated optional column is null/unset (e.g. 006_add_telegram_tokens.sql
    // not yet applied), strip that null field and retry so the rest of the update lands.
    const missingCol = error.message.match(/Could not find the '([^']+)' column/)?.[1];
    if (error.code === 'PGRST204' && missingCol && missingCol in pending && pending[missingCol] === null) {
      console.warn(`[api/projects/update] skipping unmigrated null column "${missingCol}"`);
      delete pending[missingCol];
      continue;
    }

    return { error };
  }

  return { error: null };
}

function updateJsonProjects(projectId: string, updates: Record<string, unknown>) {
  updateProjectsJson(projectId, (target) => {
    if (typeof updates.title === 'string') target.title = updates.title;
    if (typeof updates.client_name === 'string') target.client = updates.client_name;
    if (typeof updates.client_email === 'string') target.clientEmail = updates.client_email;
    if (typeof updates.status === 'string') target.status = updates.status as any;
    if (typeof updates.progress === 'number') target.progress = updates.progress;
    if (typeof updates.day_current === 'number') target.dayCurrent = updates.day_current;
    if (typeof updates.day_total === 'number') target.dayTotal = updates.day_total;
    if (typeof updates.demo === 'string') target.demo = updates.demo;
    if (typeof updates.github === 'string') target.github = updates.github;
    if (updates.telegram_bot_token !== undefined) target.telegramBotToken = (updates.telegram_bot_token as string) || undefined;
    if (updates.telegram_chat_id !== undefined) target.telegramChatId = (updates.telegram_chat_id as string) || undefined;
    if (updates.client_telegram_token !== undefined) target.clientTelegramToken = (updates.client_telegram_token as string) || undefined;
    if (updates.client_telegram_chat_id !== undefined) target.clientTelegramChatId = (updates.client_telegram_chat_id as string) || undefined;
  });
}

/**
 * PATCH/POST endpoint for updating project state from the admin panel.
 * Gated by the agent cookie (same as /admin/layout).
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const agentToken = (await cookies()).get(AGENT_COOKIE)?.value || authHeader;
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
      telegram_bot_token,
      telegram_chat_id,
      client_telegram_token,
      client_telegram_chat_id,
      telegramBotToken,
      telegramChatId,
      clientTelegramToken,
      clientTelegramChatId,
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

    const finalTgBotToken = telegram_bot_token !== undefined ? telegram_bot_token : telegramBotToken;
    const finalTgChatId = telegram_chat_id !== undefined ? telegram_chat_id : telegramChatId;
    const finalClientTgToken = client_telegram_token !== undefined ? client_telegram_token : clientTelegramToken;
    const finalClientTgChatId = client_telegram_chat_id !== undefined ? client_telegram_chat_id : clientTelegramChatId;

    if (finalTgBotToken !== undefined) updates.telegram_bot_token = finalTgBotToken;
    if (finalTgChatId !== undefined) updates.telegram_chat_id = finalTgChatId;
    if (finalClientTgToken !== undefined) updates.client_telegram_token = finalClientTgToken;
    if (finalClientTgChatId !== undefined) updates.client_telegram_chat_id = finalClientTgChatId;

    // Handle password update if specified
    if (typeof client_password === 'string' && client_password.trim()) {
      await setClientPassword(projectId, client_password.trim());
    }

    // Always update JSON fallback
    updateJsonProjects(projectId, updates);

    // Update Supabase if configured
    if (isSupabaseConfigured() && Object.keys(updates).length > 0) {
      const sb = requireSupabaseAdmin();

      // Snapshot live active days before updating so pausing/completing freezes
      // the counter and editing other fields while active doesn't reset updated_at.
      const table = sb.from('projects') as unknown as {
        select?: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => PromiseLike<{ data: Record<string, unknown> | null }>;
          };
        };
      };
      if (typeof table.select === 'function') {
        const { data: existing } = await table
          .select('status, day_current, start_date, updated_at')
          .eq('id', projectId)
          .maybeSingle();

        if (existing && existing.status === 'active') {
          const existingDay = typeof existing.day_current === 'number' ? existing.day_current : 0;
          const userChangedDay = typeof day_current === 'number' && day_current !== existingDay;
          if (!userChangedDay) {
            updates.day_current = computeEffectiveDayCurrent({
              status: 'active',
              dayCurrent: existingDay,
              startDate: (existing.start_date as string | null) ?? null,
              updatedAt: (existing.updated_at as string | null) ?? null,
            });
          }
        }
      }

      const { error } = await updateSupabaseProject(sb, projectId, updates);
      if (error) {
        console.error('[api/projects/update] Supabase error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/admin/${projectId}`);
    revalidatePath(`/portal/${projectId}`);

    return NextResponse.json({ ok: true, projectId, updates });
  } catch (e: any) {
    console.error('[api/projects/update] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}