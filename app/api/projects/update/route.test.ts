import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockCookiesGet,
  mockRevalidatePath,
  mockUpdateProjectsJson,
  mockSetClientPassword,
  mockIsSupabaseConfigured,
  mockRequireSupabaseAdmin,
} = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockUpdateProjectsJson: vi.fn(),
  mockSetClientPassword: vi.fn(),
  mockIsSupabaseConfigured: vi.fn(() => true),
  mockRequireSupabaseAdmin: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock('@/lib/agent-auth', () => ({
  AGENT_SECRET: 'test-secret',
  AGENT_COOKIE: 'ch_agent',
}));

vi.mock('@/lib/client-passwords', () => ({
  updateProjectsJson: mockUpdateProjectsJson,
  setClientPassword: mockSetClientPassword,
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: mockIsSupabaseConfigured,
  requireSupabaseAdmin: mockRequireSupabaseAdmin,
}));

import { POST } from './route';

function makeRequest(body: Record<string, unknown>, token = 'test-secret') {
  return new NextRequest('http://localhost:3000/api/projects/update', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/projects/update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue(undefined);
    mockIsSupabaseConfigured.mockReturnValue(true);
  });

  it('returns 403 when unauthorized', async () => {
    const res = await POST(makeRequest({ projectId: 'p1', title: 'New' }, 'wrong'));
    expect(res.status).toBe(403);
  });

  it('updates Supabase and revalidates paths on success', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    mockRequireSupabaseAdmin.mockReturnValue({ from: vi.fn(() => ({ update })) });

    const res = await POST(
      makeRequest({
        projectId: 'proj-1',
        title: 'Updated Title',
        progress: 75,
        status: 'active',
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({
      title: 'Updated Title',
      progress: 75,
      status: 'active',
    });
    expect(eq).toHaveBeenCalledWith('id', 'proj-1');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/proj-1');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/portal/proj-1');
  });

  it('strips unmigrated null Telegram columns (PGRST204) and retries update', async () => {
    const updatePayloads: Record<string, unknown>[] = [];
    const eq = vi.fn().mockImplementation(async () => {
      const lastPayload = updatePayloads[updatePayloads.length - 1];
      if ('client_telegram_chat_id' in lastPayload) {
        return {
          error: {
            code: 'PGRST204',
            message:
              "Could not find the 'client_telegram_chat_id' column of 'projects' in the schema cache",
          },
        };
      }
      if ('client_telegram_token' in lastPayload) {
        return {
          error: {
            code: 'PGRST204',
            message:
              "Could not find the 'client_telegram_token' column of 'projects' in the schema cache",
          },
        };
      }
      if ('telegram_bot_token' in lastPayload) {
        return {
          error: {
            code: 'PGRST204',
            message:
              "Could not find the 'telegram_bot_token' column of 'projects' in the schema cache",
          },
        };
      }
      return { error: null };
    });

    const update = vi.fn((payload: Record<string, unknown>) => {
      updatePayloads.push({ ...payload });
      return { eq };
    });
    mockRequireSupabaseAdmin.mockReturnValue({ from: vi.fn(() => ({ update })) });

    const res = await POST(
      makeRequest({
        projectId: 'proj-1',
        title: 'Saved Title',
        telegram_bot_token: null,
        client_telegram_token: null,
        client_telegram_chat_id: null,
      })
    );

    expect(res.status).toBe(200);
    expect(updatePayloads).toHaveLength(4);
    expect(updatePayloads[3]).toEqual({ title: 'Saved Title' });
  });

  it('returns 500 when an unmigrated column has a non-null value', async () => {
    const eq = vi.fn().mockResolvedValue({
      error: {
        code: 'PGRST204',
        message:
          "Could not find the 'telegram_bot_token' column of 'projects' in the schema cache",
      },
    });
    const update = vi.fn(() => ({ eq }));
    mockRequireSupabaseAdmin.mockReturnValue({ from: vi.fn(() => ({ update })) });

    const res = await POST(
      makeRequest({
        projectId: 'proj-1',
        title: 'Saved Title',
        telegram_bot_token: '123:abc',
      })
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('telegram_bot_token');
  });

  it('returns 500 on unexpected Supabase errors instead of faking 200', async () => {
    const eq = vi.fn().mockResolvedValue({
      error: { code: '42501', message: 'permission denied for table projects' },
    });
    const update = vi.fn(() => ({ eq }));
    mockRequireSupabaseAdmin.mockReturnValue({ from: vi.fn(() => ({ update })) });

    const res = await POST(makeRequest({ projectId: 'proj-1', title: 'New' }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('permission denied for table projects');
  });
});
