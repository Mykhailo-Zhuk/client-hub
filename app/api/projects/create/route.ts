import { NextRequest, NextResponse } from 'next/server';
import { createProject } from '@/lib/projects-db';
import { generateToken } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;
    
    const body = await req.json();
    const secret = token || body.secret;

    if (!secret || secret !== process.env.AGENT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validation
    const { title, client_name, client_email, description } = body;

    if (!title || !client_name || !client_email) {
      return NextResponse.json(
        { error: 'Missing required fields: title, client_name, client_email' },
        { status: 400 }
      );
    }

    // 3. Project Creation
    // Generate a simple ID based on title or random token
    const id = generateToken().slice(0, 12);

    const newProject = {
      id,
      title,
      client_name,
      client_email,
      description: description || null,
      status: 'active' as const,
      progress: 0,
      day_current: 0,
      day_total: 0,
      start_date: new Date().toISOString().split('T')[0],
      estimated_end: null,
      tags: [],
      github: null,
      demo: null,
      cover: null,
    };

    await createProject(newProject);

    return NextResponse.json(
      { 
        message: 'Project created successfully', 
        project: { id, title } 
      }, 
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[api/projects/create] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
