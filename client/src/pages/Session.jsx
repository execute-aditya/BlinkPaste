import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PasswordCard from '../components/PasswordCard'
import MessageFeed from '../components/MessageFeed'
import MessageInput from '../components/MessageInput'
import DeviceCounter from '../components/DeviceCounter'
import TimerBar from '../components/TimerBar'
import SyncDot from '../components/SyncDot'
import ExpiredModal from '../components/ExpiredModal'

/**
 * Session — The main chat sharing page.
 *
 * Realtime architecture (single Supabase channel per session):
 *   - postgres_changes INSERT   → instant message sync between devices
 *   - Broadcast "session_expired" → show expired modal (sent by Edge Function via HTTP API)
 *   - Presence sync/join/leave  → live device count
 *   - postgres_changes DELETE   → show expired modal when row is deleted by Edge Function
 *
 * Message flow:
 *   1. User types and sends → local INSERT to Supabase
 *   2. Supabase postgres_changes event triggers
 *   3. All devices (including sender) receive message and append to feed
 *   4. Late joiners → fetch all messages from DB on mount
 */
export default function Session() {
  const { password: encodedPassword } = useParams()
  const password = decodeURIComponent(encodedPassword)
  const { state } = useLocation()
  const navigate = useNavigate()

  // If no name was passed via navigation state, redirect to landing
  const name = state?.name
  useEffect(() => {
    if (!name) {
      navigate('/', { replace: true })
    }
  }, [name, navigate])

  // ── Core state ────────────────────────────────────────────
  const [messages, setMessages] = useState([])
  const [deviceCount, setDeviceCount] = useState(0)
  const [expiresAt, setExpiresAt] = useState(null)
  const [isExpired, setIsExpired] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionNotFound, setSessionNotFound] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // ── Refs ──────────────────────────────────────────────────
  const channelRef = useRef(null)
  const syncTimeoutRef = useRef(null)

  // ── Flash sync dot ────────────────────────────────────────
  const flashSync = useCallback(() => {
    setIsSyncing(true)
    clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => setIsSyncing(false), 800)
  }, [])

  // ── Main init effect ──────────────────────────────────────
  useEffect(() => {
    if (!name || !password) return

    let channel
    let cleanedUp = false

    const init = async () => {
      // 1. Fetch session row for metadata
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('expires_at')
        .eq('password', password)
        .maybeSingle()

      if (cleanedUp) return

      if (sessionError || !session) {
        setSessionNotFound(true)
        setIsLoading(false)
        return
      }

      if (new Date(session.expires_at) < new Date()) {
        setIsExpired(true)
        setIsLoading(false)
        return
      }

      setExpiresAt(new Date(session.expires_at))

      // 2. Fetch existing messages
      const { data: existingMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_password', password)
        .order('created_at', { ascending: true })

      if (cleanedUp) return

      if (!messagesError && existingMessages) {
        setMessages(existingMessages)
      }

      setIsLoading(false)

      // 3. Create Supabase Realtime channel
      channel = supabase.channel(password, {
        config: {
          broadcast: {
            self: false,
          },
          presence: {
            key: `${name}-${Math.random().toString(36).slice(2, 7)}`,
          },
        },
      })

      // 4. Set up listeners before subscribing
      channel
        // ── DB Change: new message inserted ─────────────────
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `session_password=eq.${password}`,
          },
          (payload) => {
            if (cleanedUp) return
            setMessages((prev) => {
              // Deduplicate just in case
              if (prev.some((m) => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
            flashSync()
          }
        )

        // ── Broadcast: session_expired (from Edge Function) ─
        .on('broadcast', { event: 'session_expired' }, () => {
          if (cleanedUp) return
          setIsExpired(true)
        })

        // ── Presence: sync (full reconciled state) ───────────
        .on('presence', { event: 'sync' }, () => {
          if (cleanedUp || !channel) return
          const presenceState = channel.presenceState()
          setDeviceCount(Object.keys(presenceState).length)
        })

        // ── Presence: join ───────────────────────────────────
        .on('presence', { event: 'join' }, () => {
          if (cleanedUp || !channel) return
          const presenceState = channel.presenceState()
          setDeviceCount(Object.keys(presenceState).length)
        })

        // ── Presence: leave ──────────────────────────────────
        .on('presence', { event: 'leave' }, () => {
          if (cleanedUp || !channel) return
          const presenceState = channel.presenceState()
          setDeviceCount(Object.keys(presenceState).length)
        })

        // ── DB Change: session row deleted (expiry by Edge Fn) ─
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'sessions',
            filter: `password=eq.${password}`,
          },
          () => {
            if (cleanedUp) return
            setIsExpired(true)
          }
        )

        // ── Subscribe ────────────────────────────────────────
        .subscribe(async (status) => {
          if (cleanedUp) return
          if (status === 'SUBSCRIBED') {
            await channel.track({
              name,
              joinedAt: new Date().toISOString(),
            })
          }
        })

      channelRef.current = channel
    }

    init()

    return () => {
      cleanedUp = true
      clearTimeout(syncTimeoutRef.current)

      if (channel) {
        channel.untrack()
        supabase.removeChannel(channel)
      }
      channelRef.current = null
    }
  }, [password, name, flashSync])

  // ── Send message handler ──────────────────────────────────
  const handleSendMessage = async (text) => {
    if (!text || isSending) return
    setIsSending(true)
    flashSync()

    const { error } = await supabase.from('messages').insert({
      session_password: password,
      sender_name: name,
      content: text,
    })

    if (error) {
      console.error('[BlinkPaste] Send message error:', error)
      // Optional: show a toast or error state here
    }
    
    setIsSending(false)
  }

  // ── Timer expiry callback ─────────────────────────────────
  const handleExpire = useCallback(() => {
    setIsExpired(true)
  }, [])

  // ── Render: not found ─────────────────────────────────────
  if (sessionNotFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-6">
        <p
          style={{
            fontFamily: 'Inter',
            fontSize: '14px',
            color: '#FF4F6A',
          }}
        >
          Session not found. The key may be invalid.
        </p>
        <Link
          to="/"
          className="btn-primary"
          style={{ maxWidth: '200px', textDecoration: 'none', textAlign: 'center' }}
        >
          Back to Home
        </Link>
      </div>
    )
  }

  // ── Render: loading ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.08)',
              borderTop: '2px solid #E8FF47',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '13px', color: '#6B6A7A', fontFamily: 'Inter' }}>
            Connecting…
          </p>
        </div>
      </div>
    )
  }

  // ── Render: session page ──────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ position: 'relative' }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,8,14,0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between gap-4"
          style={{ flexWrap: 'wrap' }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0 }}
          >
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#EEEDF5',
                letterSpacing: '-0.01em',
              }}
            >
              BlinkPaste
            </span>
            <span
              className="cursor-blink"
              style={{ fontSize: '1.25rem', marginLeft: '1px' }}
            >
              |
            </span>
          </Link>

          {/* Right cluster: sync dot + device count + timer */}
          <div className="flex items-center gap-5 flex-wrap">
            <SyncDot active={isSyncing} />
            <DeviceCounter count={deviceCount} />
            <TimerBar expiresAt={expiresAt} onExpire={handleExpire} />
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-5 h-full relative" style={{ maxHeight: 'calc(100vh - 73px)' }}>
        {/* Password card (fixed at top of main area) */}
        <div className="shrink-0">
          <PasswordCard password={password} />
        </div>

        {/* Message Feed (scrollable area) */}
        <MessageFeed messages={messages} myName={name} />

        {/* Message Input (fixed at bottom) */}
        <MessageInput onSend={handleSendMessage} isLoading={isSending} />
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      {/* We can hide the footer or keep it minimal so it doesn't interrupt the chat feel */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '1.25rem',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: '12px', color: '#6B6A7A', fontFamily: 'Inter' }}>
          BlinkPaste — Built for speed. Built to disappear.
        </p>
      </footer>

      {/* ── Expired modal ────────────────────────────────── */}
      {isExpired && <ExpiredModal />}
    </div>
  )
}
