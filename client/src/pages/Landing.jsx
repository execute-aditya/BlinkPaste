import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generatePassword } from '../utils/generatePassword'

/**
 * Landing — Two glassmorphism cards: "Start a Session" and "Join a Session".
 * Name input auto-focuses on mount.
 * Create flow: generates password client-side via crypto, inserts row to Supabase, navigates.
 * Join flow: validates session exists, not expired, then navigates.
 */
export default function Landing() {
  const navigate = useNavigate()
  const nameCreateRef = useRef(null)

  // ── Create session state ──────────────────────────────────
  const [createName, setCreateName] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // ── Join session state ────────────────────────────────────
  const [joinName, setJoinName] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinShaking, setJoinShaking] = useState(false)

  // Auto-focus the first name input on mount
  useEffect(() => {
    nameCreateRef.current?.focus()
  }, [])

  // Trigger shake animation for 400ms then reset
  const triggerShake = () => {
    setJoinShaking(true)
    setTimeout(() => setJoinShaking(false), 420)
  }

  // ── Create session handler ────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()
    const trimmedName = createName.trim()
    const trimmedPassword = createPassword.trim()
    if (!trimmedName || !trimmedPassword) return

    setCreateLoading(true)
    setCreateError('')

    try {
      const { error } = await supabase.from('sessions').insert({
        password: trimmedPassword,
        text: '',
        last_edited_by: null,
        last_edited_at: null,
      })

      if (error) {
        if (error.code === '23505') { // Postgres unique_violation
          setCreateError('This session key is already taken.')
        } else {
          setCreateError('Could not create session. Please try again.')
        }
        return
      }

      navigate(`/session/${encodeURIComponent(trimmedPassword)}`, {
        state: { name: trimmedName },
      })
    } catch (err) {
      console.error('[BlinkPaste] Create session error:', err)
      setCreateError('Something went wrong. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  // ── Join session handler ──────────────────────────────────
  const handleJoin = async (e) => {
    e.preventDefault()
    const trimmedName = joinName.trim()
    const trimmedPassword = joinPassword.trim()
    if (!trimmedName || !trimmedPassword) return

    setJoinLoading(true)
    setJoinError('')

    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('password, expires_at')
        .eq('password', trimmedPassword)
        .maybeSingle()

      if (error) {
        setJoinError('Something went wrong. Please try again.')
        triggerShake()
        return
      }

      if (!session) {
        setJoinError('Invalid session key.')
        triggerShake()
        return
      }

      if (new Date(session.expires_at) < new Date()) {
        setJoinError('This session no longer exists.')
        triggerShake()
        return
      }

      navigate(`/session/${encodeURIComponent(session.password)}`, {
        state: { name: trimmedName },
      })
    } catch (err) {
      console.error('[BlinkPaste] Join session error:', err)
      setJoinError('Something went wrong. Please try again.')
      triggerShake()
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ overflow: 'hidden' }}
    >
      {/* Ambient background glow */}
      <div
        className="ambient-glow"
        style={{ opacity: 0.06, zIndex: 0 }}
        aria-hidden="true"
      />

      {/* ── Logo ─────────────────────────────────────────── */}
      <header className="relative z-10 text-center mb-10">
        <div className="flex items-center justify-center mb-4">
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#EEEDF5',
              letterSpacing: '-0.02em',
            }}
          >
            BlinkPaste
          </span>
          <span className="cursor-blink" style={{ fontSize: '2.25rem', marginLeft: '1px' }}>
            |
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#EEEDF5',
            marginBottom: '0.5rem',
            letterSpacing: '-0.01em',
          }}
        >
          Blink. Paste.{' '}
          <span style={{ color: '#E8FF47' }}>Gone.</span>
        </h1>

        <p
          style={{
            fontFamily: 'Inter',
            fontSize: '14px',
            color: '#6B6A7A',
            maxWidth: '380px',
            lineHeight: 1.6,
          }}
        >
          Instant clipboard sync across any device. No account. Expires in 60&nbsp;minutes.
        </p>
      </header>

      {/* ── Cards ────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col md:flex-row gap-4 w-full max-w-[680px]">
        {/* Create Session Card */}
        <form
          onSubmit={handleCreate}
          className="glass-card flex-1 flex flex-col gap-5 p-7"
          noValidate
        >
          {/* Card header */}
          <div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'Inter',
                fontWeight: 600,
                color: '#4FFFB0',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#4FFFB0',
                  display: 'inline-block',
                }}
              />
              Start a Session
            </div>
            <p style={{ fontSize: '13px', color: '#6B6A7A', fontFamily: 'Inter' }}>
              Generate a private shared clipboard
            </p>
          </div>

          {/* Name input */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="create-name"
              style={{ fontSize: '12px', color: '#6B6A7A', fontFamily: 'Inter' }}
            >
              Your name
            </label>
            <input
              id="create-name"
              ref={nameCreateRef}
              type="text"
              className="input-field"
              placeholder="Your name"
              value={createName}
              onChange={(e) => {
                setCreateName(e.target.value.slice(0, 20))
                setCreateError('')
              }}
              maxLength={20}
              autoComplete="off"
            />
            <span style={{ fontSize: '11px', color: '#6B6A7A', fontFamily: 'Inter', textAlign: 'right' }}>
              {createName.length}/20
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="create-password"
              style={{ fontSize: '12px', color: '#6B6A7A', fontFamily: 'Inter' }}
            >
              Custom session key
            </label>
            <input
              id="create-password"
              type="text"
              className="input-field"
              placeholder="Choose a secret key"
              value={createPassword}
              onChange={(e) => {
                setCreatePassword(e.target.value.trim())
                setCreateError('')
              }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.05em',
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          {/* Error */}
          {createError && (
            <p
              style={{
                fontSize: '12px',
                color: '#FF4F6A',
                fontFamily: 'Inter',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#FF4F6A" strokeWidth="1.2" />
                <path d="M6 3.5v3M6 8h.01" stroke="#FF4F6A" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {createError}
            </p>
          )}

          <button
            type="submit"
            id="create-session-btn"
            className="btn-primary mt-auto"
            disabled={createLoading || !createName.trim() || !createPassword.trim()}
          >
            {createLoading ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon />
                Creating…
              </span>
            ) : (
              'Create Session'
            )}
          </button>
        </form>


        {/* Divider */}
        <div className="flex md:hidden items-center gap-4">
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '12px', color: '#6B6A7A', fontFamily: 'Inter' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Join Session Card */}
        <form
          onSubmit={handleJoin}
          className={`glass-card flex-1 flex flex-col gap-5 p-7 ${
            joinShaking ? 'shake' : ''
          }`}
          noValidate
        >
          {/* Card header */}
          <div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'Inter',
                fontWeight: 600,
                color: '#E8FF47',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#E8FF47',
                  display: 'inline-block',
                }}
              />
              Join a Session
            </div>
            <p style={{ fontSize: '13px', color: '#6B6A7A', fontFamily: 'Inter' }}>
              Enter your session key to connect
            </p>
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="join-name"
                style={{ fontSize: '12px', color: '#6B6A7A', fontFamily: 'Inter' }}
              >
                Your name
              </label>
              <input
                id="join-name"
                type="text"
                className="input-field"
                placeholder="Your name"
                value={joinName}
                onChange={(e) => {
                  setJoinName(e.target.value.slice(0, 20))
                  setJoinError('')
                }}
                maxLength={20}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="join-password"
                style={{ fontSize: '12px', color: '#6B6A7A', fontFamily: 'Inter' }}
              >
                Session key
              </label>
              <input
                id="join-password"
                type="text"
                className="input-field"
                placeholder="Enter session key"
                value={joinPassword}
                onChange={(e) => {
                  setJoinPassword(e.target.value.trim())
                  setJoinError('')
                }}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.05em',
                }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Error */}
          {joinError && (
            <p
              style={{
                fontSize: '12px',
                color: '#FF4F6A',
                fontFamily: 'Inter',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#FF4F6A" strokeWidth="1.2" />
                <path d="M6 3.5v3M6 8h.01" stroke="#FF4F6A" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {joinError}
            </p>
          )}

          <button
            type="submit"
            id="join-session-btn"
            className="btn-primary mt-auto"
            disabled={joinLoading || !joinName.trim() || !joinPassword.trim()}
          >
            {joinLoading ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon />
                Joining…
              </span>
            ) : (
              'Join Session'
            )}
          </button>
        </form>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="relative z-10 mt-12 text-center">
        <p style={{ fontSize: '12px', color: '#6B6A7A', fontFamily: 'Inter' }}>
          BlinkPaste — Built for speed. Built to disappear.
        </p>
        <p style={{ fontSize: '11px', color: '#4B4A5A', fontFamily: 'Inter', marginTop: '4px' }}>
          Sessions expire in 60 minutes. All data is permanently deleted on expiry.
        </p>
      </footer>
    </div>
  )
}

/** Inline spinner icon for loading states */
function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ animation: 'spin 0.7s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  )
}
