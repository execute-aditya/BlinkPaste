import { useNavigate } from 'react-router-dom'

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
        {/* Icon: hourglass / timer done */}
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="#FF4F6A"
              strokeWidth="1.5"
            />
            <path
              d="M12 7v5l3 3"
              stroke="#FF4F6A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#EEEDF5',
            marginBottom: '0.75rem',
          }}
        >
          Session Ended
        </h2>

        {/* Body */}
        <p
          style={{
            fontFamily: 'Inter',
            fontSize: '14px',
            color: '#6B6A7A',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          This session has expired. All shared text has been permanently deleted.
        </p>

        {/* CTA */}
        <button
          id="expired-new-session-btn"
          className="btn-primary"
          onClick={() => navigate('/')}
        >
          Start a New Session
        </button>
      </div>
    </div>
  )
}
