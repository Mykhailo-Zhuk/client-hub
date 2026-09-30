import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from './supabase';
import type { Project } from './types';

const PASSWORDS_FILE = path.join(process.cwd(), 'data', 'client-passwords.json');
const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');

/**
 * Default password is the email username before '@'.
 * For example:
 * - "client@iron-master.example" -> "client"
 * - "sashasquilts@gmail.com" -> "sashasquilts"
 */
export function getDefaultPassword(email: string): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '';
  }
  return email.split('@')[0].trim();
}

function readPasswordsFile(): Record<string, string> {
  try {
    if (!fs.existsSync(PASSWORDS_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(PASSWORDS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[client-passwords] error reading passwords file:', err);
    return {};
  }
}

function writePasswordsFile(passwords: Record<string, string>): void {
  try {
    const dir = path.dirname(PASSWORDS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwords, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[client-passwords] error writing passwords file:', err);
  }
}

function updateProjectsJson(
  projectId: string,
  updater: (p: Project) => void
): void {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return;
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    const projects: Project[] = JSON.parse(raw);
    const target = projects.find((p) => p.id === projectId);
    if (target) {
      updater(target);
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[client-passwords] error updating projects.json:', err);
  }
}

/**
 * Returns true if a custom password has been explicitly set for this project.
 */
export async function hasCustomPassword(projectId: string): Promise<boolean> {
  // 1. Check Supabase first if configured
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('projects')
        .select('client_password')
        .eq('id', projectId)
        .maybeSingle();
      if (!error && (data as any)?.client_password) {
        return true;
      }
    } catch {
      // Column might not exist yet in Supabase
    }
  }

  // 2. Check local JSON store fallback
  const fileStore = readPasswordsFile();
  if (fileStore[projectId]) return true;

  return false;
}

/**
 * Get the effective password for a project.
 * Returns the custom password if set, or defaults to the email name before '@'.
 */
export async function getClientPassword(
  projectId: string,
  clientEmail?: string
): Promise<string> {
  // 1. Check Supabase first if configured (primary persistent database)
  const sb = getSupabaseAdmin();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('projects')
        .select('client_password, client_email')
        .eq('id', projectId)
        .maybeSingle();
      if (!error && data) {
        const row = data as any;
        if (row.client_password) {
          return row.client_password;
        }
        if (!clientEmail && row.client_email) {
          clientEmail = row.client_email;
        }
      }
    } catch {
      // Silently fall back to file or default password
    }
  }

  // 2. Check local JSON file (fallback for offline / local-only dev)
  const fileStore = readPasswordsFile();
  if (fileStore[projectId]) {
    return fileStore[projectId];
  }

  // 3. Fallback to default password (email username before '@')
  return getDefaultPassword(clientEmail || '');
}

/**
 * Set a custom password for a client project.
 */
export async function setClientPassword(
  projectId: string,
  newPassword: string
): Promise<void> {
  const trimmed = newPassword.trim();
  if (!trimmed) return;

  // 1. Save to data/client-passwords.json (best-effort local file store)
  const fileStore = readPasswordsFile();
  fileStore[projectId] = trimmed;
  writePasswordsFile(fileStore);

  // 2. Update data/projects.json (best-effort local file store)
  updateProjectsJson(projectId, (p) => {
    p.clientPassword = trimmed;
  });

  // 3. Update Supabase (primary persistent store)
  const sb = getSupabaseAdmin();
  if (sb) {
    const { error } = await sb
      .from('projects')
      .update({ client_password: trimmed })
      .eq('id', projectId);
    if (error) {
      if (error.code === 'PGRST204' || error.code === '42703') {
        throw new Error(
          "Database column 'client_password' is missing in Supabase. Please run migration 005_add_client_password.sql in your Supabase SQL Editor."
        );
      }
      throw new Error(`Failed to update password in database: ${error.message}`);
    }
  }
}

/**
 * Update the client email for a project.
 */
export async function updateClientEmail(
  projectId: string,
  newEmail: string
): Promise<void> {
  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('Valid email required');
  }

  // 1. Update data/projects.json (best-effort local)
  updateProjectsJson(projectId, (p) => {
    p.clientEmail = trimmed;
  });

  // 2. Update Supabase
  const sb = getSupabaseAdmin();
  if (sb) {
    const { error } = await sb
      .from('projects')
      .update({ client_email: trimmed })
      .eq('id', projectId);
    if (error) {
      console.warn('[client-passwords] Supabase client_email update warning:', error.message);
      throw new Error(`Failed to update email in database: ${error.message}`);
    }
  }
}

/**
 * Verifies whether the provided input password matches the project's password.
 */
export async function verifyClientPassword(
  projectId: string,
  clientEmail: string,
  inputPassword: string
): Promise<boolean> {
  const expected = await getClientPassword(projectId, clientEmail);
  if (!expected) return false;
  return inputPassword.trim() === expected;
}
