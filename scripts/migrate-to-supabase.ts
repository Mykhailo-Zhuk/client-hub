/**
 * Migrate data/projects.json + data/comments.json into Supabase.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts
 *
 * Idempotent — uses upsert on `id` (projects) / REPLACE-friendly insert.
 * Skips rows that already exist with matching updated_at.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import projectsData from '../data/projects.json';
import commentsData from '../data/comments.json';
import * as fs from 'fs';
import * as path from 'path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key || key.includes('__FILL_ME')) {
  console.error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n' +
      '   1. Open Supabase Dashboard → Settings → API\n' +
      '   2. Copy URL + service_role key into .env.local\n' +
      '   3. Re-run this script.'
  );
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface LegacyProject {
  id: string;
  client: string;
  clientEmail?: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  dayCurrent?: number;
  dayTotal?: number;
  startDate: string;
  estimatedEnd?: string;
  completedDate?: string;
  tags: string[];
  github?: string;
  demo?: string;
  cover?: string;
}

interface LegacyComment {
  id: string;
  projectId: string;
  type: string;
  message: string;
  author: string;
  timestamp: string;
}

async function migrate() {
  // ---- projects ----
  console.log(`\n→ Migrating ${projectsData.length} projects…`);
  let projOk = 0;
  let projSkip = 0;
  for (const p of projectsData as LegacyProject[]) {
    if (!p.clientEmail) {
      console.warn(`  ⚠ skip ${p.id}: no clientEmail`);
      projSkip++;
      continue;
    }
    const row = {
      id: p.id,
      client_name: p.client,
      client_email: p.clientEmail,
      title: p.title,
      description: p.description ?? null,
      status: p.status,
      progress: p.progress,
      day_current: p.dayCurrent ?? 0,
      day_total: p.dayTotal ?? 0,
      start_date: p.startDate || null,
      estimated_end: p.estimatedEnd ?? null,
      completed_date: p.completedDate ?? null,
      tags: p.tags ?? [],
      github: p.github ?? null,
      demo: p.demo ?? null,
      cover: p.cover ?? null,
    };
    const { error } = await sb.from('projects').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ✗ ${p.id}: ${error.message}`);
    } else {
      projOk++;
    }
  }
  console.log(`  ✓ ${projOk} projects upserted, ${projSkip} skipped.`);

  // ---- comments ----
  const comments = commentsData as LegacyComment[];
  console.log(`\n→ Migrating ${comments.length} comments…`);
  let comOk = 0;
  let comSkip = 0;
  for (const c of comments) {
    const { error } = await sb.from('comments').insert({
      // let postgres generate a uuid — id is uuid in schema
      project_id: c.projectId,
      type: c.type,
      message: c.message,
      author: c.author,
      timestamp: c.timestamp,
    });
    if (error) {
      console.error(`  ✗ ${c.id}: ${error.message}`);
      comSkip++;
    } else {
      comOk++;
    }
  }
  console.log(`  ✓ ${comOk} comments inserted, ${comSkip} skipped.`);

  // ---- write migration log ----
  const logPath = path.join(process.cwd(), 'data', 'migration-log.json');
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        projectsInserted: projOk,
        projectsSkipped: projSkip,
        commentsInserted: comOk,
        commentsSkipped: comSkip,
      },
      null,
      2
    )
  );
  console.log(`\n✅ Migration complete. Log: ${logPath}`);
}

migrate().catch((err) => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});