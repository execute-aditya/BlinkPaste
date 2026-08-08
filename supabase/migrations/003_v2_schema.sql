-- BlinkPaste v2.0 Schema Migration
-- Execute this in your Supabase SQL Editor

-- 1. Create sessions_v2 table (replaces sessions)
CREATE TABLE IF NOT EXISTS sessions_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL, -- 6 char alphanumeric
  session_name TEXT,
  passcode_hash TEXT NOT NULL,
  host_device_id TEXT,
  is_locked BOOLEAN DEFAULT false,
  max_devices INT DEFAULT 30,
  encrypt_content BOOLEAN DEFAULT true,
  destroy_on_expire BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX IF NOT EXISTS sessions_v2_id_idx ON sessions_v2(session_id);
CREATE INDEX IF NOT EXISTS sessions_v2_expires_idx ON sessions_v2(expires_at);

-- 2. Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions_v2(session_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  browser TEXT,
  os TEXT,
  role TEXT DEFAULT 'participant', -- 'host' or 'participant'
  is_blocked BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, device_id)
);

-- 3. Create clipboard_items table (replaces old text field)
CREATE TABLE IF NOT EXISTS clipboard_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions_v2(session_id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_device_id TEXT NOT NULL,
  content TEXT NOT NULL, -- Encrypted ciphertext
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create messages_v2 table (adds burn after reading support)
CREATE TABLE IF NOT EXISTS messages_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions_v2(session_id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_device_id TEXT NOT NULL,
  content TEXT NOT NULL, -- Encrypted ciphertext
  burn_type TEXT DEFAULT 'none', -- 'none', '1view', '5min', etc.
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create files table (metadata for storage)
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions_v2(session_id) ON DELETE CASCADE,
  filename TEXT NOT NULL, -- Encrypted
  mime_type TEXT,
  size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create secrets table
CREATE TABLE IF NOT EXISTS secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions_v2(session_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Encrypted ciphertext
  created_by TEXT NOT NULL,
  burn_type TEXT DEFAULT '1view',
  max_views INT DEFAULT 1,
  view_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions_v2(session_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS) on all v2 tables
ALTER TABLE sessions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- IMPORTANT NOTE ON RLS POLICIES:
-- To keep the architecture simple without user accounts, the v2 Edge Functions
-- (create-session, join-session) will handle passcode verification and issue a 
-- signed JWT containing the session_id as a custom claim.
-- 
-- The RLS policies would then look like this:
-- CREATE POLICY "Allow access to session participants" ON clipboard_items
--   FOR ALL USING (session_id = (current_setting('request.jwt.claims', true)::json->>'session_id'));
--
-- For local development and initial testing without the JWT edge function setup,
-- you can temporarily bypass RLS by running:
-- ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
