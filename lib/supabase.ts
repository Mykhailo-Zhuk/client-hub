import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const SUPABASE_TIMEOUT_MS = 3500;
const CIRCUIT_BREAKER_COOLDOWN_MS = 15000;

let _lastError: { message: string; timestamp: number } | null = null;
let _circuitOpenUntil = 0;

export function recordSupabaseError(message: string) {
  _lastError = { message, timestamp: Date.now() };
}

export function clearSupabaseError() {
  _lastError = null;
  _circuitOpenUntil = 0;
}

export function getLastSupabaseError(): { message: string; timestamp: number } | null {
  return _lastError;
}

/**
 * Custom fetch with a strict timeout and short circuit-breaker so a paused
 * or unreachable Supabase instance fails fast (~3.5s max once, 0ms for
 * parallel/subsequent calls) instead of hanging Vercel functions for 28s+.
 */
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const now = Date.now();
  if (_circuitOpenUntil > now) {
    const msg =
      _lastError?.message ||
      `Supabase temporarily unreachable (circuit open for ${Math.ceil((_circuitOpenUntil - now) / 1000)}s)`;
    throw new Error(msg);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal
        ? AbortSignal.any([init.signal, controller.signal])
        : controller.signal,
    });
    if (res.status >= 502 && res.status <= 504) {
      const errMsg = `Supabase gateway error (HTTP ${res.status})`;
      recordSupabaseError(errMsg);
      _circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
    }
    return res;
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || err.name === 'TimeoutError' || err.message.includes('aborted'));
    const errMsg = isAbort
      ? `Supabase request timed out after ${SUPABASE_TIMEOUT_MS}ms (database may be paused or unreachable)`
      : err instanceof Error
      ? `Supabase network error: ${err.message}`
      : 'Supabase network error';
    recordSupabaseError(errMsg);
    _circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
    throw new Error(errMsg);
  } finally {
    clearTimeout(timer);
  }
};

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
      global: { fetch: fetchWithTimeout },
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
    global: { fetch: fetchWithTimeout },
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