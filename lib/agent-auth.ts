/**
 * Single source of truth for the agent auth secret.
 *
 * Resolution order (read at module load time):
 *   1. process.env.AGENT_SECRET   -- set this on Vercel
 *   2. process.env.AGENT_PASSWORD -- legacy alias kept for back-compat
 *   3. dev fallback               -- ONLY when NODE_ENV !== 'production'
 *
 * IMPORTANT: every guard (layout, route handler, login API) MUST import
 * AGENT_SECRET from this module. Do not re-declare the env lookup
 * locally -- that drift is exactly what caused the 2026-09-21 incident
 * where /admin rejected cookies issued by /api/agent-login because each
 * file had its own fallback string.
 */

const FALLBACK_DEV_SECRET = 'misha-zhuk-dev-2026';

function resolveAgentSecret() {
  // Either name works; trim to defend against trailing whitespace/CRLF from
  // dashboards or copy-paste. The previous version used `&&` between the two
  // env names, which silently disabled the resolution whenever only one of
  // them was set (the common case on Vercel).
  const fromEnv = (process.env.AGENT_SECRET || process.env.AGENT_PASSWORD || '').trim();
  if (fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV !== 'production') return FALLBACK_DEV_SECRET;
  return '';
}
export const AGENT_SECRET = resolveAgentSecret();
export const AGENT_COOKIE = 'agent_token';
export function isUsingDevFallback() {
  return (
    AGENT_SECRET === FALLBACK_DEV_SECRET &&
    !process.env.AGENT_SECRET &&
    !process.env.AGENT_PASSWORD
  );
}
