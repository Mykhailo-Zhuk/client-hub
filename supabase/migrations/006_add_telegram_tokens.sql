-- ============================================================================
-- client-hub → Supabase migration (006_add_telegram_tokens.sql)
-- Add telegram_bot_token, client_telegram_token, client_telegram_chat_id
-- ============================================================================

alter table projects 
add column if not exists telegram_bot_token text,
add column if not exists client_telegram_token text,
add column if not exists client_telegram_chat_id text;
