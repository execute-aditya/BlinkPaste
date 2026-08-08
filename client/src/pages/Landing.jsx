import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import SessionCreatedModal from '../components/SessionCreatedModal'
import QRCodeModal from '../components/QRCodeModal'
import { QrCode, Shield, Timer, KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Dummy generator for development before Edge Function is wired up
const generateDummySessionId = () => Math.random().toString(36).substring(2, 8).toUpperCase()

export default function Landing() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Auto-fill from URL params (QR code join)
  const initialJoinId = searchParams.get('join') || ''
  const initialJoinPass = searchParams.get('pass') || ''

  // ── Create session state ──────────────────────────────────
  const [createSessionName, setCreateSessionName] = useState('')
  const [createDisplayName, setCreateDisplayName] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createDuration, setCreateDuration] = useState('60')
  const [createConfig, setCreateConfig] = useState({ encrypt: true, destroy: true })
  
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  
  const [createdSession, setCreatedSession] = useState(null)
  const [showCreatedModal, setShowCreatedModal] = useState(false)

  // ── Join session state ────────────────────────────────────
  const [joinDisplayName, setJoinDisplayName] = useState('')
  const [joinSessionId, setJoinSessionId] = useState(initialJoinId)
  const [joinPassword, setJoinPassword] = useState(initialJoinPass)
  
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinShaking, setJoinShaking] = useState(false)

  const triggerShake = () => {
    setJoinShaking(true)
    setTimeout(() => setJoinShaking(false), 420)
  }

  const [showQR, setShowQR] = useState(false)

  // ── Handlers ──────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createDisplayName.trim() || !createPassword.trim()) return

    setCreateLoading(true)
    setCreateError('')

    try {
      const { data, error } = await supabase.functions.invoke('create-session', {
        body: {
          sessionName: createSessionName,
          displayName: createDisplayName,
          passcode: createPassword,
          durationMinutes: parseInt(createDuration, 10),
          config: createConfig
        }
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)

      setCreatedSession({
        id: data.sessionId,
        passcode: createPassword,
        displayName: createDisplayName,
        sessionName: createSessionName,
        config: createConfig,
        token: data.token,
        deviceId: data.deviceId
      })
      setShowCreatedModal(true)
    } catch (err) {
      console.error(err)
      setCreateError('Could not create session. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinDisplayName.trim() || !joinSessionId.trim() || !joinPassword.trim()) return

    setJoinLoading(true)
    setJoinError('')

    try {
      const { data, error } = await supabase.functions.invoke('join-session', {
        body: {
          sessionId: joinSessionId,
          displayName: joinDisplayName,
          passcode: joinPassword,
          browser: 'Web',
          os: navigator.platform
        }
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)
      
      navigate(`/session/${encodeURIComponent(joinSessionId)}`, {
        state: { 
          name: joinDisplayName,
          passcode: joinPassword,
          isHost: false,
          sessionName: data.sessionName,
          config: data.config,
          token: data.token,
          deviceId: data.deviceId
        }
      })
    } catch (err) {
      console.error(err)
      setJoinError('Invalid Session ID or Passcode.')
      triggerShake()
    } finally {
      setJoinLoading(false)
    }
  }

  const handleContinueToWorkspace = () => {
    if (!createdSession) return
    navigate(`/session/${encodeURIComponent(createdSession.id)}`, {
      state: { 
        name: createdSession.displayName,
        passcode: createdSession.passcode,
        isHost: true,
        sessionName: createdSession.sessionName,
        config: createdSession.config,
        token: createdSession.token,
        deviceId: createdSession.deviceId
      }
    })
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ overflow: 'hidden' }}>
      <div className="ambient-glow" style={{ opacity: 0.06, zIndex: 0 }} aria-hidden="true" />

      <header className="relative z-10 text-center mb-10">
        <div className="flex items-center justify-center mb-4">
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.25rem', fontWeight: 700, color: '#EEEDF5', letterSpacing: '-0.02em' }}>
            BlinkPaste
          </span>
          <span className="cursor-blink" style={{ fontSize: '2.25rem', marginLeft: '1px' }}>|</span>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#EEEDF5', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
          Blink. Paste. <span style={{ color: '#E8FF47' }}>Gone.</span>
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#6B6A7A', maxWidth: '380px', lineHeight: 1.6 }}>
          Instant clipboard sync across any device. No account. Expires in 60 minutes.
        </p>
      </header>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 w-full max-w-[800px]">
        {/* CREATE SESSION CARD */}
        <form onSubmit={handleCreate} className="glass-card flex-1 flex flex-col p-7" noValidate>
          <div className="mb-6">
            <div className="text-[10px] font-semibold text-accent-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary inline-block" />
              Create Secure Session
            </div>
            <p className="text-[13px] text-white/40">Generate a private workspace</p>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Session Name (Optional)</label>
              <input type="text" className="input-field py-2.5" placeholder="e.g. Project Sync" value={createSessionName} onChange={e => setCreateSessionName(e.target.value)} maxLength={30} />
            </div>
            
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Your Display Name</label>
              <input type="text" className="input-field py-2.5" placeholder="Your name" value={createDisplayName} onChange={e => setCreateDisplayName(e.target.value)} maxLength={20} required />
            </div>
            
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Session Passcode</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="password" className="input-field py-2.5 pl-9 font-mono" placeholder="Choose a secret passcode" value={createPassword} onChange={e => setCreatePassword(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Session Duration</label>
              <div className="relative">
                <Timer size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <select className="select-field py-2.5 pl-9" value={createDuration} onChange={e => setCreateDuration(e.target.value)}>
                  <option value="15">15 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="120">2 Hours</option>
                </select>
              </div>
            </div>

            <div className="mt-2 bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[10px] uppercase text-white/40 font-semibold mb-3 flex items-center gap-1.5">
                <Shield size={12} /> Security Options
              </div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={createConfig.encrypt} onChange={e => setCreateConfig({...createConfig, encrypt: e.target.checked})} className="checkbox-custom" />
                <span className="text-xs text-white/80">Encrypt shared content (E2E)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={createConfig.destroy} onChange={e => setCreateConfig({...createConfig, destroy: e.target.checked})} className="checkbox-custom" />
                <span className="text-xs text-white/80">Destroy data when session expires</span>
              </label>
            </div>
          </div>

          {createError && <p className="text-xs text-error mt-4 flex items-center gap-1.5"><ShieldAlert size={14} />{createError}</p>}
          
          <button type="submit" className="btn-primary mt-6" disabled={createLoading || !createDisplayName.trim() || !createPassword.trim()}>
            {createLoading ? 'Creating...' : 'Create Session'}
          </button>
        </form>


        <div className="flex md:hidden items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>


        {/* JOIN SESSION CARD */}
        <form onSubmit={handleJoin} className={`glass-card flex-1 flex flex-col p-7 ${joinShaking ? 'shake' : ''}`} noValidate>
          <div className="mb-6">
            <div className="text-[10px] font-semibold text-accent-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary inline-block" />
              Join Session
            </div>
            <p className="text-[13px] text-white/40">Connect to an active workspace</p>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Your Display Name</label>
              <input type="text" className="input-field py-2.5" placeholder="Your name" value={joinDisplayName} onChange={e => {setJoinDisplayName(e.target.value); setJoinError('')}} maxLength={20} />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Session ID</label>
              <input type="text" className="input-field py-2.5 font-mono uppercase tracking-wider" placeholder="e.g. X7K29P" value={joinSessionId} onChange={e => {setJoinSessionId(e.target.value.toUpperCase()); setJoinError('')}} maxLength={6} />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Session Passcode</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="password" className="input-field py-2.5 pl-9 font-mono" placeholder="Enter passcode" value={joinPassword} onChange={e => {setJoinPassword(e.target.value); setJoinError('')}} />
              </div>
            </div>
            
            <div className="mt-auto pt-6 flex flex-col gap-3">
              {joinError && <p className="text-xs text-error flex items-center gap-1.5 justify-center"><AlertOctagon size={14} />{joinError}</p>}
              
              <button type="submit" className="btn-primary" disabled={joinLoading || !joinDisplayName.trim() || !joinSessionId.trim() || !joinPassword.trim()} style={{ background: 'var(--accent-primary)', color: '#000' }}>
                {joinLoading ? 'Joining...' : 'Join Session'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <footer className="relative z-10 mt-12 flex gap-4 text-xs text-white/40">
        <Link to="/about" className="hover:text-white transition-colors">About</Link>
        <span>•</span>
        <Link to="/developer" className="hover:text-white transition-colors">Developer</Link>
      </footer>

      {showCreatedModal && createdSession && (
        <SessionCreatedModal 
          sessionId={createdSession.id}
          passcode={createdSession.passcode}
          onShowQR={() => setShowQR(true)}
          onContinue={handleContinueToWorkspace}
        />
      )}

      {showQR && (
        <QRCodeModal
          sessionId={createdSession ? createdSession.id : ''}
          passcode={createdSession ? createdSession.passcode : ''}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  )
}

function AlertOctagon({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function ShieldAlert({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}
