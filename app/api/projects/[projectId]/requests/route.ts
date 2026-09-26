import { NextRequest, NextResponse } from 'next/server';
import { getRequestsByProjectAsync } from '@/lib/requests-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    const data = await getRequestsByProjectAsync(projectId);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[GET /api/projects/${projectId}/requests] failed:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
