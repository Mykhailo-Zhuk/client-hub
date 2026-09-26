-- ============================================================================
-- client-hub → Supabase migration (003_project_requests.sql)
-- ============================================================================

-- ---------- project_requests ----------
create table if not exists project_requests (
  id uuid primary key default gen_random_uuid(),
  project_id text references projects(id) on delete cascade,
  text text not null,
  status text default 'pending', -- pending | fulfilled
  created_at timestamptz default now(),
  response_text text,
  responded_at timestamptz
);

create index if not exists project_requests_project_id_idx on project_requests(project_id);
create index if not exists project_requests_status_idx on project_requests(status);

-- ---------- RLS ----------
alter table project_requests enable row level security;

-- Service role bypasses RLS (used by lib/supabase.ts admin client)
drop policy if exists "Service role full access requests" on project_requests;
create policy "Service role full access requests" on project_requests
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Client can view requests for projects tied to their email
drop policy if exists "Users can view requests for their own project" on project_requests;
create policy "Users can view requests for their own project" on project_requests
  for select using (
    project_id in (select id from projects where client_email = auth.jwt() ->> 'email')
  );
