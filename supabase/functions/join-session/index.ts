// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const JWT_SECRET = Deno.env.get('JWT_SECRET') || SUPABASE_SERVICE_ROLE_KEY

// --- Crypto helpers using only Web Crypto API ---

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function verifyPasscode(passcode: string, storedHash: string): Promise<boolean> {
  // storedHash format: base64url(salt)$base64url(derivedKey)
  const parts = storedHash.split('$')
  if (parts.length !== 2) return false

  const salt = base64urlDecode(parts[0])
  const storedDerived = base64urlDecode(parts[1])

  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(passcode), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )

  // Constant-time comparison
  const derivedArr = new Uint8Array(derived)
  if (derivedArr.length !== storedDerived.length) return false
  let diff = 0
  for (let i = 0; i < derivedArr.length; i++) diff |= derivedArr[i] ^ storedDerived[i]
  return diff === 0
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
    const { sessionId, displayName, passcode, browser, os } = await req.json()

    if (!sessionId || !displayName || !passcode) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Fetch Session
    const { data: session, error: sessionError } = await supabase
      .from('sessions_v2')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Invalid Session ID or Passcode' }), { status: 401, headers })
    }

    // 2. Check Expiry and Lock Status
    if (new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session has expired' }), { status: 401, headers })
    }

    if (session.is_locked) {
      return new Response(JSON.stringify({ error: 'Session is locked by the host' }), { status: 403, headers })
    }

    // 3. Verify Passcode (PBKDF2 via Web Crypto)
    const isValid = await verifyPasscode(passcode, session.passcode_hash)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid Session ID or Passcode' }), { status: 401, headers })
    }

    // 4. Register Device
    const deviceId = 'dev_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16)

    await supabase.from('devices').insert({
      session_id: sessionId,
      device_id: deviceId,
      display_name: displayName,
      browser: browser || 'Unknown',
      os: os || 'Unknown',
      role: 'participant'
    })

    // 5. Log Security Event
    await supabase.from('security_events').insert({
      session_id: sessionId,
      event_type: 'join',
      description: `${displayName} joined the session`,
      device_id: deviceId
    })

    // 6. Generate JWT (HS256 via Web Crypto)
    const remainingMs = new Date(session.expires_at).getTime() - Date.now()
    const exp = Math.floor(Date.now() / 1000) + Math.max(1, Math.floor(remainingMs / 1000))

    const jwt = await createJWT({
      sub: deviceId,
      role: 'authenticated',
      session_id: sessionId,
      device_id: deviceId,
      is_host: false,
      exp
    }, JWT_SECRET)

    return new Response(JSON.stringify({
      sessionId,
      deviceId,
      token: jwt,
      sessionName: session.session_name,
      config: {
        encrypt: session.encrypt_content,
        destroy: session.destroy_on_expire
      }
    }), { headers })

  } catch (err) {
    console.error('join-session error:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers })
  }
})
