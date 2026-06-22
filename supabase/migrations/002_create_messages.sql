-- BlinkPaste: messages table for WhatsApp-style chat feed
-- Run this in your Supabase SQL Editor or via `supabase db push`

CREATE TABLE IF NOT EXISTS messages (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_password TEXT        NOT NULL,
  sender_name      TEXT        NOT NULL,
  content          TEXT        NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_session
    FOREIGN KEY(session_password)
    REFERENCES sessions(password)
    ON DELETE CASCADE
);

-- Index for fast querying by session and ordering by time
CREATE INDEX IF NOT EXISTS messages_session_created_idx ON messages (session_password, created_at);

-- RLS: disabled — BlinkPaste uses no user accounts.
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Grant the anon role explicit access.
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO anon;

-- Enable Realtime on this table so clients receive INSERT events
-- Note: Requires `messages` table to be added to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
