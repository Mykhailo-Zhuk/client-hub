import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _browserClient: SupabaseClient | null | undefined;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (_browserClient !== undefined) return _browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey || anonKey.includes('__FILL_ME')) {
    _browserClient = null;
    return null;
  }
  _browserClient = createClient(url, anonKey, {
    realtime: {
      params: { eventsPerSecond: 20 },
    },
  });
  return _browserClient;
}
