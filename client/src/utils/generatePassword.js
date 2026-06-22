import { supabase } from '../lib/supabase'

/**
 * Character pools — ambiguous characters removed (0, O, 1, l, I).
 */
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no O, I
const LOWER = 'abcdefghjkmnpqrstuvwxyz' // no l
const DIGITS = '23456789' // no 0, 1
const SYMBOLS = '@#$!&*^'
const ALL = UPPER + LOWER + DIGITS + SYMBOLS

/**
 * Cryptographically secure integer in [0, max).
 * Uses crypto.getRandomValues to avoid modulo bias.
 */
function secureRandInt(max) {
  // Rejection-sampling to eliminate modulo bias
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
 * Pick one random character from a string pool.
 */
function pickFrom(pool) {
  return pool[secureRandInt(pool.length)]
}

/**
 * Fisher–Yates shuffle on an array (in-place).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Build one 14-character password:
 *   - 2 chars from each pool (UPPER, LOWER, DIGITS, SYMBOLS) = 8 chars
 *   - 6 chars from the combined pool
 *   - Fisher-Yates shuffled
 */
function buildPassword() {
  const chars = [
    pickFrom(UPPER),
    pickFrom(UPPER),
    pickFrom(LOWER),
    pickFrom(LOWER),
    pickFrom(DIGITS),
    pickFrom(DIGITS),
    pickFrom(SYMBOLS),
    pickFrom(SYMBOLS),
    ...Array.from({ length: 6 }, () => pickFrom(ALL)),
  ]
  return shuffle(chars).join('')
}

/**
 * Generate a unique 14-character session password.
 * Checks Supabase for collisions and regenerates until unique
 * (collisions are astronomically unlikely but we guarantee correctness).
 *
 * @returns {Promise<string>} A unique, cryptographically strong 14-char password.
 */
export async function generatePassword() {
  let password
  let attempts = 0

  do {
    password = buildPassword()
    attempts++

    const { data, error } = await supabase
      .from('sessions')
      .select('password')
      .eq('password', password)
      .maybeSingle()

    // If no row found (data is null and no error), password is unique
    if (!error && !data) break

    if (attempts > 10) {
      throw new Error('[BlinkPaste] Failed to generate a unique password after 10 attempts.')
    }
  } while (true)

  return password
}
