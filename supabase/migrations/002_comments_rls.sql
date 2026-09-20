-- ============================================================================
-- client-hub → 002_comments_rls.sql
--
-- Defence-in-depth RLS hardening for `comments` table.
--
-- The portal currently authenticates with a custom HMAC JWT (`ch_session`)
-- and the server talks to Postgres via the supabase SERVICE_ROLE key, which
-- already bypasses RLS. So today's read/write paths do NOT depend on these
-- policies. They exist for a future world where the React portal calls
-- Supabase directly from the browser.
--
-- Changes vs 001_initial.sql:
--   * Drop the brittle `auth.jwt() ->> 'email'` lookup (returns NULL unless
--     the request carries a Supabase Auth session JWT, which portal users
--     never have).
--   * Resolve the user's email via `auth.uid()` + `auth.users` so the policy
--     works in the standard Supabase-Auth flow.
--   * Keep the service-role bypass.
-- ============================================================================

drop policy if exists "Users can view comments on their own project" on comments;
create policy "Users can view comments on their own project" on comments
  for select using (
    project_id in (
      select id from projects
      where client_email = (
        select email from auth.users where id = auth.uid()
      )
    )
  );

drop policy if exists "Users can comment on their own project" on comments;
create policy "Users can comment on their own project" on comments
  for insert with check (
    project_id in (
      select id from projects
      where client_email = (
        select email from auth.users where id = auth.uid()
      )
    )
  );
