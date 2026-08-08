/**
 * BlinkPaste — Client-Side Encryption Module
 *
 * Zero-knowledge architecture: all content is encrypted/decrypted
 * in the browser. The server only ever stores ciphertext.
 *
 * Algorithm: AES-GCM (256-bit) with PBKDF2 key derivation from session passcode.
 * IV: 12-byte random nonce prepended to each ciphertext.
 * Salt: 16-byte random, stored once per session and shared with all devices.
 */

const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH = 256 // bits
const IV_LENGTH = 12 // bytes
const SALT_LENGTH = 16 // bytes

/**
 * Generate a random salt for key derivation.
 * @returns {string} Base64-encoded salt
 */
export function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return uint8ToBase64(salt)
}

/**
 * Derive an AES-GCM key from a passcode and salt using PBKDF2.
 * @param {string} passcode - Session passcode
 * @param {string} saltB64 - Base64-encoded salt
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(passcode, saltB64) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is disabled because this page is served over insecure HTTP on a local IP. Please access the app using HTTPS (e.g. the localtunnel URL) or from localhost.')
  }

  const encoder = new TextEncoder()
  const salt = base64ToUint8(saltB64)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt plaintext with AES-GCM.
 * Returns base64 string: [12-byte IV][ciphertext]
 *
 * @param {string} plaintext
 * @param {CryptoKey} key
 * @returns {Promise<string>} Base64-encoded ciphertext with prepended IV
 */
export async function encrypt(plaintext, key) {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )

  // Prepend IV to ciphertext
  const combined = new Uint8Array(IV_LENGTH + cipherBuffer.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipherBuffer), IV_LENGTH)

  return uint8ToBase64(combined)
}

/**
 * Decrypt AES-GCM ciphertext.
 * Expects base64 string: [12-byte IV][ciphertext]
 *
 * @param {string} ciphertextB64
 * @param {CryptoKey} key
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decrypt(ciphertextB64, key) {
  const combined = base64ToUint8(ciphertextB64)
  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  return new TextDecoder().decode(plainBuffer)
}

/**
 * Encrypt if a key is provided, otherwise return plaintext.
 * Convenience wrapper for optional encryption.
 */
export async function encryptIfEnabled(text, key) {
  if (!key) return text
  return encrypt(text, key)
}

/**
 * Decrypt if a key is provided, otherwise return ciphertext as-is.
 * Convenience wrapper for optional encryption.
 */
export async function decryptIfEnabled(text, key) {
  if (!key) return text
  try {
    return await decrypt(text, key)
  } catch {
    // If decryption fails (e.g. unencrypted legacy data), return as-is
    return text
  }
}

// ── Base64 helpers ─────────────────────────────────────────

function uint8ToBase64(uint8) {
  let binary = ''
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i])
  }
  return btoa(binary)
}

function base64ToUint8(b64) {
  const binary = atob(b64)
  const uint8 = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    uint8[i] = binary.charCodeAt(i)
  }
  return uint8
}
