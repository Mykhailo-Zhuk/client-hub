import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockCookiesGet,
  mockGetProjectByIdAsync,
  mockSendTelegramNotification,
} = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockGetProjectByIdAsync: vi.fn(),
  mockSendTelegramNotification: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}));

vi.mock('@/lib/agent-auth', () => ({
  AGENT_SECRET: 'test-secret',
  AGENT_COOKIE: 'ch_agent',
}));

vi.mock('@/lib/projects-db', () => ({
  getProjectByIdAsync: mockGetProjectByIdAsync,
}));

vi.mock('@/lib/telegram', () => ({
  sendTelegramNotification: mockSendTelegramNotification,
}));

import { POST } from './route';

function makeRequest(body: Record<string, unknown>, token = 'test-secret') {
  return new NextRequest('http://localhost:3000/api/stream/notify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/stream/notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue(undefined);
  });

  it('returns 403 when unauthorized', async () => {
    const res = await POST(makeRequest({ projectId: 'p1' }, 'bad'));
    expect(res.status).toBe(403);
  });

  it('skips Telegram when clientTelegramChatId is not set', async () => {
    mockGetProjectByIdAsync.mockResolvedValue({
      id: 'p1',
      title: 'Test',
      client: 'Client',
      status: 'active',
      progress: 50,
      startDate: '2026-11-01',
      tags: [],
    });

    const res = await POST(makeRequest({ projectId: 'p1', note: 'Working on UI' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, notified: false, reason: 'no_client_chat_id' });
    expect(mockSendTelegramNotification).not.toHaveBeenCalled();
  });

  it('sends Telegram notification to client when clientTelegramChatId is set', async () => {
    mockGetProjectByIdAsync.mockResolvedValue({
      id: 'p1',
      title: 'Test',
      client: 'Client',
      status: 'active',
      progress: 50,
      startDate: '2026-11-01',
      tags: [],
      clientTelegramChatId: '987654321',
    });
    mockSendTelegramNotification.mockResolvedValue({ ok: true, mock: false });

    const res = await POST(makeRequest({ projectId: 'p1', note: 'Fixing checkout' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.notified).toBe(true);
    expect(mockSendTelegramNotification).toHaveBeenCalledWith(
      'p1',
      expect.stringContaining('Fixing checkout'),
      expect.objectContaining({ recipient: 'client' })
    );
  });
});
