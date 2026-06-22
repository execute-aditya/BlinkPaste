-- BlinkPaste: sessions table
-- Run this in your Supabase SQL Editor or via `supabase db push`

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  password      TEXT        UNIQUE NOT NULL,
  text          TEXT        DEFAULT '',
  last_edited_by TEXT       DEFAULT NULL,
  last_edited_at TIMESTAMPTZ DEFAULT NULL,
  device_count  INT         DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- Index for fast password lookup (the primary join key for all queries)
CREATE INDEX IF NOT EXISTS sessions_password_idx ON sessions (password);

-- Index for the expiry cleanup query run by the Edge Function every 5 minutes
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

-- RLS: disabled — BlinkPaste uses no user accounts.
-- All access is controlled by the 14-char cryptographic session password.
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- Grant the anon role explicit access.
-- Supabase's REST API requires these even when RLS is disabled,
-- otherwise the anon key receives a 401 Unauthorized.
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO anon;

-- Enable Realtime on this table so clients receive DELETE events
-- via postgres_changes subscriptions (used for session expiry detection).
-- NOTE: You must also enable Replication for this table in the Supabase
-- dashboard: Database → Replication → supabase_realtime → Add Table → sessions
