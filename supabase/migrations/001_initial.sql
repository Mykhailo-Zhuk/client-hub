-- ============================================================================
-- client-hub → Supabase migration (001_initial.sql)
-- Run via: supabase db push   OR  paste into Dashboard → SQL Editor
-- ============================================================================

-- ---------- projects ----------
create table if not exists projects (
  id text primary key,
  client_name text not null,
  client_email text not null,
  title text not null,
  description text,
  status text default 'active', -- active | completed | paused
  progress int default 0,
  day_current int default 0,
  day_total int default 0,
  start_date date,
  estimated_end date,
  completed_date date,
  tags text[] default '{}',
  github text,
  demo text,
  cover text,
  telegram_chat_id text, -- optional per-project TG target
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists projects_client_email_idx on projects(client_email);
create index if not exists projects_status_idx on projects(status);

-- ---------- comments ----------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id text references projects(id) on delete cascade,
  type text default 'update', -- update | client_reply | milestone | deploy | bug_fix | general | feedback
  message text not null,
  author text not null, -- email or "Agent"
  timestamp timestamptz default now()
);

create index if not exists comments_project_id_idx on comments(project_id);
create index if not exists comments_timestamp_idx on comments(timestamp desc);

-- ---------- updated_at trigger ----------
create or replace function ch_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
  before update on projects
  for each row execute function ch_set_updated_at();

-- ---------- RLS ----------
alter table projects enable row level security;
alter table comments enable row level security;

-- Service role bypasses RLS (used by lib/supabase.ts admin client)
drop policy if exists "Service role full access projects" on projects;
create policy "Service role full access projects" on projects
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role full access comments" on comments;
create policy "Service role full access comments" on comments
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Client (anon + authenticated) reads only projects tied to their email.
-- The portal uses supabaseAdmin (service_role) so this is defence-in-depth
-- for any future direct browser calls.
drop policy if exists "Users can view their own project" on projects;
create policy "Users can view their own project" on projects
  for select using (client_email = auth.jwt() ->> 'email');

drop policy if exists "Users can view comments on their own project" on comments;
create policy "Users can view comments on their own project" on comments
  for select using (
    project_id in (select id from projects where client_email = auth.jwt() ->> 'email')
  );

drop policy if exists "Users can comment on their own project" on comments;
create policy "Users can comment on their own project" on comments
  for insert with check (
    project_id in (select id from projects where client_email = auth.jwt() ->> 'email')
  );