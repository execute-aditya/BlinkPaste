import { useState } from 'react'

/**
 * PasswordCard — Pill-shaped dark card with slow yellow-lime glow border animation.
 * Displays the session key in JetBrains Mono with a copy button.
 *
 * @param {{ password: string }} props
 */
export default function PasswordCard({ password }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Fallback for browsers that block clipboard API
      const el = document.createElement('textarea')
      el.value = password
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="password-pill flex items-center justify-between gap-4">
      {/* Left: labels */}
      <div className="flex flex-col gap-1 min-w-0">
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'Inter',
            color: '#6B6A7A',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 600,
          }}
        >
          Session Key
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '1.15rem',
            fontWeight: 500,
            color: '#EEEDF5',
            letterSpacing: '0.06em',
            wordBreak: 'break-all',
          }}
        >
          {password}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'Inter',
            color: '#6B6A7A',
          }}
        >
          Share with up to 30 devices
        </span>
      </div>

      {/* Right: copy button */}
      <button
        id="copy-password-btn"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy session key'}
        style={{
          flexShrink: 0,
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: copied
            ? 'rgba(79,255,176,0.12)'
            : 'rgba(255,255,255,0.05)',
          color: copied ? '#4FFFB0' : '#6B6A7A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {copied ? (
          /* Checkmark icon */
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8l3.5 3.5L13 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          /* Copy icon */
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect
              x="5"
              y="5"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M3 9.5H2a1 1 0 01-1-1v-7a1 1 0 011-1h7a1 1 0 011 1v1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
