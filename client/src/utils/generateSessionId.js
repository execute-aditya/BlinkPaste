/**
 * BlinkPaste — Session ID Generator
 *
 * Generates a 6-character alphanumeric session ID using
 * crypto.getRandomValues for cryptographic randomness.
 *
 * Character set: uppercase letters + digits (no ambiguous chars: 0, O, I, 1, L)
 * Collision space: 28^6 ≈ 481M combinations
 */

import { supabase } from '../lib/supabase'

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ2345679' // 29 chars, no ambiguous
const SESSION_ID_LENGTH = 6

/**
 * Cryptographically secure random integer in [0, max).
 */
function secureRandInt(max) {
  const limit = Math.floor(0x100000000 / max) * max
  let r
  const buf = new Uint32Array(1)
  do {
    crypto.getRandomValues(buf)
    r = buf[0]
  } while (r >= limit)
  return r % max
}

/**
 * Build a single 6-character session ID.
 */
function buildSessionId() {
  let id = ''
  for (let i = 0; i < SESSION_ID_LENGTH; i++) {
    id += CHARSET[secureRandInt(CHARSET.length)]
  }
  return id
}

/**
 * Generate a unique 6-character session ID.
 * Checks Supabase for collisions before returning.
 *
 * @returns {Promise<string>} Unique session ID
 */
export async function generateSessionId() {
  let sessionId
  let attempts = 0

  do {
    sessionId = buildSessionId()
    attempts++

    const { data, error } = await supabase
      .from('sessions')
      .select('session_id')
      .eq('session_id', sessionId)
      .maybeSingle()

    // No row found = unique
    if (!error && !data) break

    if (attempts > 10) {
      throw new Error('[BlinkPaste] Failed to generate unique session ID after 10 attempts.')
    }
  } while (true)

  return sessionId
}
