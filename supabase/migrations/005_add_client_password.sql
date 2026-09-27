-- ============================================================================
-- client-hub → Supabase migration (005_add_client_password.sql)
-- Add client_password column to projects table
-- ============================================================================

alter table projects 
add column if not exists client_password text;
