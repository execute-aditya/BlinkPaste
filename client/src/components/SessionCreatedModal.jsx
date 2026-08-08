import { useState } from 'react'
import { Copy, QrCode, Share2, CheckCircle2 } from 'lucide-react'
import { copyToClipboard } from '../utils/clipboard'

/**
 * SessionCreatedModal
 * Shown immediately after a host successfully creates a new session.
 */
export default function SessionCreatedModal({ sessionId, passcode, onShowQR, onContinue }) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const joinUrl = `${window.location.origin}/?join=${sessionId}&pass=${passcode}`

  const handleCopy = async (text, setCopiedState) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedState(true)
      setTimeout(() => setCopiedState(false), 2000)
    } else {
      alert("Failed to copy text. Please copy manually.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-card w-full max-w-md p-8 animate-modal-in flex flex-col items-center">
        
        <div className="w-16 h-16 rounded-full bg-accent-secondary/10 flex items-center justify-center mb-6">
          <CheckCircle2 size={32} className="text-accent-secondary" />
        </div>
        
        <h2 className="text-2xl font-display font-bold text-white mb-2">Session Created</h2>
        <p className="text-sm text-white/60 text-center mb-8">
          Your secure workspace is ready. Share these credentials with participants to let them join.
        </p>

        <div className="w-full bg-bg rounded-xl p-4 border border-white/5 mb-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-1">Session ID</div>
              <div className="font-mono text-lg font-medium text-white">{sessionId}</div>
            </div>
            <button 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors"
              onClick={() => handleCopy(sessionId, setCopiedId)}
              title="Copy ID"
            >
              {copiedId ? <span className="text-xs text-accent-secondary">Copied</span> : <Copy size={16} />}
            </button>
          </div>

          <div className="h-px bg-white/5 w-full" />

          <div className="flex justify-between items-center">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-1">Passcode</div>
              <div className="font-mono text-lg font-medium text-white">••••••••</div>
            </div>
            <button 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors"
              onClick={() => handleCopy(passcode, setCopiedPass)}
              title="Copy Passcode"
            >
              {copiedPass ? <span className="text-xs text-accent-secondary">Copied</span> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="w-full flex gap-3 mb-8">
          <button 
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
            onClick={onShowQR}
          >
            <QrCode size={16} />
            Show QR Code
          </button>
          <button 
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
            onClick={() => handleCopy(joinUrl, setCopiedLink)}
          >
            <Share2 size={16} />
            {copiedLink ? 'Copied Link' : 'Share Link'}
          </button>
        </div>

        <button className="btn-primary w-full" onClick={onContinue}>
          Enter Workspace
        </button>
      </div>
    </div>
  )
}
