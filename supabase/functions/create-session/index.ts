// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const JWT_SECRET = Deno.env.get('JWT_SECRET') || SUPABASE_SERVICE_ROLE_KEY

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ2345679'

function buildSessionId() {
  let id = ''
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  for (let i = 0; i < 6; i++) {
    id += CHARSET[arr[i] % CHARSET.length]
  }
  return id
}

// --- Crypto helpers using only Web Crypto API ---

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hashPasscode(passcode: string): Promise<string> {
  // Generate a random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  // Import passcode as key material
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(passcode), 'PBKDF2', false, ['deriveBits'])
  // Derive 32 bytes using PBKDF2
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  // Store as salt$hash (both base64url encoded)
  return base64url(salt.buffer) + '$' + base64url(derived)
}

async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)).buffer)
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)).buffer)
  const message = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return `${message}.${base64url(signature)}`
}

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers })

  try {
    const { sessionName, displayName, passcode, durationMinutes, config } = await req.json()

    if (!displayName || !passcode) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Generate unique Session ID
    let sessionId = ''
    let attempts = 0
    while (attempts < 10) {
      sessionId = buildSessionId()
      const { data } = await supabase.from('sessions_v2').select('session_id').eq('session_id', sessionId).maybeSingle()
      if (!data) break
      attempts++
    }

    // 2. Hash passcode with PBKDF2 (Web Crypto only)
    const passcodeHash = await hashPasscode(passcode)

    // 3. Create session
    const duration = durationMinutes || 60
    const expiresAt = new Date(Date.now() + duration * 60000).toISOString()
    const hostDeviceId = 'dev_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16)

    const { error: sessionError } = await supabase.from('sessions_v2').insert({
      session_id: sessionId,
      session_name: sessionName || null,
      passcode_hash: passcodeHash,
      host_device_id: hostDeviceId,
      encrypt_content: config?.encrypt ?? true,
      destroy_on_expire: config?.destroy ?? true,
      expires_at: expiresAt
    })

    if (sessionError) throw sessionError

    // 4. Register host device
    await supabase.from('devices').insert({
      session_id: sessionId,
      device_id: hostDeviceId,
      display_name: displayName,
      role: 'host'
    })

    // 5. Log security event
    await supabase.from('security_events').insert({
      session_id: sessionId,
      event_type: 'join',
      description: `Session created by ${displayName}`,
      device_id: hostDeviceId
    })

    // 6. Generate JWT (HS256 via Web Crypto)
    const exp = Math.floor(Date.now() / 1000) + duration * 60
    const jwt = await createJWT({
      sub: hostDeviceId,
      role: 'authenticated',
      session_id: sessionId,
      device_id: hostDeviceId,
      is_host: true,
      exp
    }, JWT_SECRET)

    return new Response(JSON.stringify({
      sessionId,
      deviceId: hostDeviceId,
      token: jwt
    }), { headers })

  } catch (err) {
    console.error('create-session error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
})
