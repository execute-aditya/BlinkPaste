import { QRCodeSVG } from 'qrcode.react'
import { X, Copy } from 'lucide-react'
import { useState } from 'react'
import { copyToClipboard } from '../utils/clipboard'

/**
 * QRCodeModal
 * Displays a QR code for quick session joining.
 */
export default function QRCodeModal({ sessionId, passcode, onClose }) {
  const [copied, setCopied] = useState(false)
  
  // Construct the join URL with pre-filled parameters
  const joinUrl = `${window.location.origin}/?join=${sessionId}&pass=${passcode}`

  const handleCopyLink = async () => {
    const success = await copyToClipboard(joinUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-card w-full max-w-sm p-6 animate-modal-in flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-6">
          <h3 className="text-xl font-display font-bold">Session QR Code</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl mb-6">
          <QRCodeSVG 
            value={joinUrl} 
            size={200} 
            bgColor="#ffffff" 
            fgColor="#08080E" 
            level="H" 
            includeMargin={false}
          />
        </div>

        <p className="text-sm text-center text-white/60 mb-6">
          Scan this code with a mobile device to instantly join the session.
        </p>

        <button 
          className="btn-secondary w-full flex items-center justify-center gap-2"
          onClick={handleCopyLink}
        >
          <Copy size={16} />
          {copied ? 'Link Copied!' : 'Copy Join Link'}
        </button>
      </div>
    </div>
  )
}
