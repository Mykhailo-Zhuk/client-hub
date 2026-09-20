import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function isConfigured(url: string, key: string): boolean {
  return Boolean(url) && Boolean(key) && !key.includes('__FILL_ME');
}

/**
 * Browser/anon client — used from React components for client-side auth.
 * Returns null when env vars are missing placeholders (dev / first-run).
 */
export const supabase: SupabaseClient | null = isConfigured(supabaseUrl, supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/**
 * Server-side admin client. Bypasses RLS. Use in API routes & server components.
 * Lazy singleton so missing env in dev doesn't crash the whole app.
 */
let _admin: SupabaseClient | null | undefined;
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_admin !== undefined) return _admin;
  if (!isConfigured(supabaseUrl, serviceRoleKey)) {
    _admin = null;
    return null;
  }
  _admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

/** Throwing accessor — call when you KNOW the project must be wired up. */
export function requireSupabaseAdmin(): SupabaseClient {
  const c = getSupabaseAdmin();
  if (!c) {
    throw new Error(
      'Supabase admin client is not configured. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.'
    );
  }
  return c;
}

export function isSupabaseConfigured(): boolean {
  return isConfigured(supabaseUrl, supabaseAnonKey) || isConfigured(supabaseUrl, serviceRoleKey);
}