/**
 * BlinkPaste — delete-expired-sessions Edge Function
 *
 * Deletes all sessions where expires_at < NOW().
 * Before deletion, broadcasts "session_expired" to each session's
 * Realtime channel via the Supabase HTTP Broadcast API so connected
 * clients show the expired modal immediately.
 *
 * Deployment:
 *   supabase functions deploy delete-expired-sessions
 *
 * Schedule (two options — choose one):
 *
 *   OPTION A — Supabase Dashboard Cron (recommended, no extensions needed):
 *     Dashboard → Edge Functions → delete-expired-sessions → Schedules → Add
 *     Cron: */5 * * * *   (every 5 minutes)
 *
 *   OPTION B — pg_cron + pg_net (requires paid plan):
 *     Run in Supabase SQL Editor:
 *
 *     CREATE EXTENSION IF NOT EXISTS pg_cron;
 *     CREATE EXTENSION IF NOT EXISTS pg_net;
 *
 *     SELECT cron.schedule(
 *       'delete-expired-sessions',
 *       '*/5 * * * *',
 *       $$
 *       SELECT net.http_post(
 *         url     := 'https://<project-ref>.supabase.co/functions/v1/delete-expired-sessions',
 *         headers := jsonb_build_object(
 *           'Content-Type',  'application/json',
 *           'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
 *         ),
 *         body    := '{}'::jsonb
 *       );
 *       $$
 *     );
 *
 *   OPTION C — External cron (free, no Supabase config needed):
 *     Use cron-job.org or similar.
 *     Endpoint: POST https://<project-ref>.supabase.co/functions/v1/delete-expired-sessions
 *     Header: Authorization: Bearer <SERVICE_ROLE_KEY>
 *     Schedule: every 5 minutes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (_req) => {
  // Admin client — bypasses RLS to delete any session
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const now = new Date().toISOString()

  // 1. Find all expired sessions BEFORE deleting (we need their passwords to broadcast)
  const { data: expiredSessions, error: fetchError } = await supabase
    .from('sessions')
    .select('password')
    .lt('expires_at', now)

  if (fetchError) {
    console.error('[BlinkPaste] Failed to fetch expired sessions:', fetchError.message)
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!expiredSessions || expiredSessions.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, deleted: 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 2. Broadcast "session_expired" to each session's Realtime channel
  //    via the Supabase Realtime HTTP Broadcast API.
  //    Clients subscribed to these channels will immediately show the expired modal.
  const broadcastMessages = expiredSessions.map((s) => ({
    topic: `realtime:${s.password}`,   // channel name as set in Session.jsx
    event: 'broadcast',
    payload: {
      type: 'broadcast',
      event: 'session_expired',
      payload: {},
    },
  }))

  try {
    await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ messages: broadcastMessages }),
    })
  } catch (broadcastErr) {
    // Broadcast failure is non-fatal — clients will detect expiry via
    // postgres_changes DELETE event and the local countdown timer.
    console.warn('[BlinkPaste] Broadcast to expired channels failed:', broadcastErr)
  }

  // 3. Delete expired sessions from the database
  //    The postgres_changes DELETE event will also notify any subscribed clients.
  const { error: deleteError } = await supabase
    .from('sessions')
    .delete()
    .lt('expires_at', now)

  if (deleteError) {
    console.error('[BlinkPaste] Failed to delete expired sessions:', deleteError.message)
    return new Response(
      JSON.stringify({ error: deleteError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  console.log(`[BlinkPaste] Deleted ${expiredSessions.length} expired session(s).`)

  return new Response(
    JSON.stringify({ ok: true, deleted: expiredSessions.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
