/**
 * BlinkPaste — Sensitive Content Detector
 *
 * Local, browser-side detection of potentially sensitive information.
 * No data is sent to any server. All checks are regex-based.
 *
 * Returns an array of { type, label, confidence } matches.
 */

const PATTERNS = [
  {
    type: 'aws_access_key',
    label: 'AWS Access Key',
    regex: /(?:^|[^A-Za-z0-9])(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}(?:[^A-Za-z0-9]|$)/,
    confidence: 'high',
  },
  {
    type: 'aws_secret_key',
    label: 'AWS Secret Key',
    regex: /(?:aws[_\-]?secret[_\-]?access[_\-]?key|AWS_SECRET_ACCESS_KEY)\s*[:=]\s*[A-Za-z0-9/+=]{40}/i,
    confidence: 'high',
  },
  {
    type: 'generic_api_key',
    label: 'API Key',
    regex: /(?:api[_\-]?key|apikey|api_secret|api_token)\s*[:=]\s*['"]?[A-Za-z0-9\-_.]{16,}['"]?/i,
    confidence: 'medium',
  },
  {
    type: 'bearer_token',
    label: 'Bearer Token',
    regex: /(?:bearer|authorization)\s*[:=]\s*['"]?(?:Bearer\s+)?[A-Za-z0-9\-_.+/=]{20,}['"]?/i,
    confidence: 'high',
  },
  {
    type: 'jwt',
    label: 'JWT Token',
    regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_\-+/=]{10,}/,
    confidence: 'high',
  },
  {
    type: 'private_key',
    label: 'Private Key',
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----/i,
    confidence: 'high',
  },
  {
    type: 'password',
    label: 'Password',
    regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{4,}['"]?/i,
    confidence: 'medium',
  },
  {
    type: 'connection_string',
    label: 'Database Connection String',
    regex: /(?:mongodb|postgres|mysql|redis|amqp|mssql):\/\/[^\s]{10,}/i,
    confidence: 'high',
  },
  {
    type: 'github_token',
    label: 'GitHub Token',
    regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/,
    confidence: 'high',
  },
  {
    type: 'slack_token',
    label: 'Slack Token',
    regex: /xox[bporas]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/,
    confidence: 'high',
  },
  {
    type: 'stripe_key',
    label: 'Stripe Key',
    regex: /(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{20,}/,
    confidence: 'high',
  },
  {
    type: 'ip_address',
    label: 'IP Address',
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/,
    confidence: 'low',
  },
  {
    type: 'ssh_key',
    label: 'SSH Key',
    regex: /ssh-(?:rsa|ed25519|dss|ecdsa)\s+[A-Za-z0-9+/=]{40,}/,
    confidence: 'high',
  },
  {
    type: 'env_secret',
    label: 'Environment Secret',
    regex: /(?:SECRET|TOKEN|CREDENTIAL|AUTH)[_A-Z]*\s*[:=]\s*['"]?[A-Za-z0-9\-_.+/=]{8,}['"]?/i,
    confidence: 'medium',
  },
]

/**
 * Scan text for potentially sensitive content.
 *
 * @param {string} text - The text to scan
 * @returns {{ detected: boolean, matches: Array<{ type: string, label: string, confidence: string }> }}
 */
export function detectSensitive(text) {
  if (!text || text.length < 4) {
    return { detected: false, matches: [] }
  }

  const matches = []
  const seenTypes = new Set()

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(text) && !seenTypes.has(pattern.type)) {
      seenTypes.add(pattern.type)
      matches.push({
        type: pattern.type,
        label: pattern.label,
        confidence: pattern.confidence,
      })
    }
  }

  return {
    detected: matches.length > 0,
    matches,
  }
}

/**
 * Get the highest-severity match from a detection result.
 * @param {Array<{ confidence: string }>} matches
 * @returns {{ type: string, label: string, confidence: string } | null}
 */
export function getHighestSeverity(matches) {
  const order = { high: 3, medium: 2, low: 1 }
  if (!matches.length) return null
  return matches.reduce((best, m) =>
    (order[m.confidence] || 0) > (order[best.confidence] || 0) ? m : best
  )
}
