import { useState, useEffect, useRef } from 'react'

/**
 * Format milliseconds into HH:MM:SS (drops hours when < 1 hour remaining).
 */
function formatRemaining(ms) {
  if (ms <= 0) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

/**
 * TimerBar — Countdown from expiresAt to 0.
 * Under 5 minutes: shifts to yellow-lime with slow pulse.
 * At 0: calls onExpire().
 *
 * @param {{ expiresAt: Date | null, onExpire: () => void }} props
 */
export default function TimerBar({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(null)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!expiresAt) return

    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now()
      if (ms <= 0) {
        setRemaining(0)
        onExpireRef.current?.()
        return
      }
      setRemaining(ms)
    }

    tick() // immediate first call
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (remaining === null) return null

  const isWarning = remaining <= 5 * 60 * 1000 // under 5 minutes
  const isDanger = remaining <= 60 * 1000 // under 1 minute

  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontSize: '11px',
          color: '#6B6A7A',
          fontFamily: 'Inter',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Expires in
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          fontWeight: 500,
          color: isWarning ? '#E8FF47' : '#EEEDF5',
          animation:
            isWarning ? 'timer-warning 1.5s ease-in-out infinite' : 'none',
          textShadow: isDanger
            ? '0 0 12px rgba(232,255,71,0.6)'
            : isWarning
            ? '0 0 6px rgba(232,255,71,0.3)'
            : 'none',
          transition: 'color 0.5s ease',
        }}
      >
        {formatRemaining(remaining)}
      </span>
    </div>
  )
}
