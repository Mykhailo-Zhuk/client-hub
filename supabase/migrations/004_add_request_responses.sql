-- ============================================================================
-- client-hub → Supabase migration (004_add_request_responses.sql)
-- ============================================================================

-- Add response columns to project_requests
alter table project_requests 
add column if not exists response_text text,
add column if not exists responded_at timestamptz;
