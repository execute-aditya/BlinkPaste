// @ts-nocheck
/**
 * BlinkPaste v2.0 — delete-expired-sessions Edge Function
 *
 * Deletes all sessions where expires_at < NOW() from the sessions_v2 table.
 * Thanks to ON DELETE CASCADE on the foreign keys, this automatically deletes
 * all associated clipboard items, messages, files, secrets, devices, and security events.
 *
 * It broadcasts a "session_expired" event before deletion so connected clients
 * show the expired modal immediately.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (_req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const now = new Date().toISOString()

  // 1. Find expired sessions in sessions_v2
  const { data: expiredSessions, error: fetchError } = await supabase
    .from('sessions_v2')
    .select('session_id')
    .lt('expires_at', now)

  if (fetchError) {
    console.error('[BlinkPaste] Failed to fetch expired sessions:', fetchError.message)
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  if (!expiredSessions || expiredSessions.length === 0) {
    return new Response(JSON.stringify({ ok: true, deleted: 0 }))
  }

  // 2. Broadcast expiration via Supabase Realtime
  const broadcastMessages = expiredSessions.map((s: { session_id: string }) => ({
    topic: `realtime:${s.session_id}`, // Using session_id instead of password for v2
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
  } catch (err) {
    console.warn('[BlinkPaste] Broadcast failed:', err)
  }

  // 3. Delete from sessions_v2 (cascades to all other v2 tables)
  const { error: deleteError } = await supabase
    .from('sessions_v2')
    .delete()
    .lt('expires_at', now)

  if (deleteError) {
    console.error('[BlinkPaste] Failed to delete sessions:', deleteError.message)
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
  }

  console.log(`[BlinkPaste] Deleted ${expiredSessions.length} expired v2 session(s).`)
  return new Response(JSON.stringify({ ok: true, deleted: expiredSessions.length }))
})
