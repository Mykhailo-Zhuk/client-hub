/**
 * In-memory and JSON file request fallback (serverless-safe).
 *
 * The primary store is Supabase (`lib/requests-db.ts`). This module is
 * loaded as a fallback when Supabase is not configured or when the
 * `project_requests` table hasn't been migrated yet.
 */
import fs from 'fs';
import path from 'path';
import type { ProjectRequest } from './types';

declare global {
  // eslint-disable-next-line no-var
  var __ch_requests: ProjectRequest[] | undefined;
}

function getRequestsFilePath(): string {
  return path.join(process.cwd(), 'data', 'requests.json');
}

function memStore(): ProjectRequest[] {
  if (!globalThis.__ch_requests) {
    try {
      const filePath = getRequestsFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        globalThis.__ch_requests = JSON.parse(raw);
      } else {
        globalThis.__ch_requests = [];
      }
    } catch {
      globalThis.__ch_requests = [];
    }
  }
  return globalThis.__ch_requests!;
}

function persistStore(): void {
  try {
    const filePath = getRequestsFilePath();
    fs.writeFileSync(filePath, JSON.stringify(memStore(), null, 2), 'utf8');
  } catch {
    // Read-only filesystem in serverless environments - memory store persists during warm lambdas
  }
}

export async function getAllRequests(): Promise<ProjectRequest[]> {
  return memStore();
}

export async function getRequestsByProject(projectId: string): Promise<ProjectRequest[]> {
  const all = await getAllRequests();
  return all
    .filter((r) => r.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createRequest(projectId: string, text: string): Promise<ProjectRequest> {
  const all = await getAllRequests();
  const request: ProjectRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    project_id: projectId,
    text,
    status: 'pending',
    created_at: new Date().toISOString(),
    response_text: null,
    responded_at: null,
  };
  all.unshift(request);
  persistStore();
  return request;
}

export async function updateRequestStatus(
  requestId: string,
  status: 'pending' | 'fulfilled'
): Promise<ProjectRequest | null> {
  const all = await getAllRequests();
  const req = all.find((r) => r.id === requestId);
  if (!req) return null;
  req.status = status;
  persistStore();
  return req;
}

export async function submitRequestResponse(
  requestId: string,
  text: string
): Promise<ProjectRequest | null> {
  const all = await getAllRequests();
  const req = all.find((r) => r.id === requestId);
  if (!req) return null;
  req.response_text = text;
  req.responded_at = new Date().toISOString();
  req.status = 'fulfilled';
  persistStore();
  return req;
}
