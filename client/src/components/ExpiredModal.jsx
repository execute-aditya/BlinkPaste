import { useNavigate } from 'react-router-dom'
import { TimerOff } from 'lucide-react'

/**
 * ExpiredModal — Full-screen backdrop blur overlay shown when a session expires.
 * Fade + scale animation (0.95 → 1) via modal-in keyframe.
 * Clicking the CTA navigates back to the landing page.
 */
export default function ExpiredModal() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(8,8,14,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '2.5rem',
          textAlign: 'center',
          animation: 'modal-in 200ms ease-out',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(255,79,106,0.1)',
            border: '1px solid rgba(255,79,106,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <TimerOff size={24} className="text-error" />
        </div>

        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#EEEDF5',
            marginBottom: '0.75rem',
          }}
        >
          Session Expired
        </h2>

        <p
          style={{
            fontFamily: 'Inter',
            fontSize: '14px',
            color: '#6B6A7A',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          The session has expired. Application-controlled session data (clipboard, messages, files, and secrets) has been permanently removed.
        </p>

        <button
          className="btn-primary"
          onClick={() => navigate('/')}
        >
          Create New Session
        </button>
      </div>
    </div>
  )
}
