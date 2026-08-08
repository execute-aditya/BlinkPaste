import { useState, useEffect } from 'react'
import { Copy, Trash2, Search, AlertTriangle } from 'lucide-react'
import { detectSensitive } from '../../utils/sensitiveDetector'
import { copyToClipboard } from '../../utils/clipboard'

/**
 * ClipboardModule
 * Allows pasting text/code, detecting sensitive content, and viewing sync history.
 */
export default function ClipboardModule({ items, onShare, onDelete, isEncryptionEnabled }) {
  const [inputText, setInputText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sensitiveWarning, setSensitiveWarning] = useState(null)

  const handleShare = () => {
    if (!inputText.trim()) return

    const { detected, matches } = detectSensitive(inputText)
    if (detected) {
      setSensitiveWarning({ text: inputText, matches })
      return
    }

    onShare(inputText)
    setInputText('')
  }

  const confirmShareSensitive = () => {
    if (sensitiveWarning) {
      onShare(sensitiveWarning.text)
      setInputText('')
      setSensitiveWarning(null)
    }
  }

  const cancelShareSensitive = () => {
    setSensitiveWarning(null)
  }

  const filteredItems = items.filter(item =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="module-container h-full flex flex-col">
      <div className="module-header shrink-0">
        <h2 className="module-title">Clipboard</h2>
        <p className="module-subtitle">Real-time synced text and code</p>
      </div>

      {/* Input Area */}
      <div className="glass-card p-4 shrink-0 flex flex-col gap-3 mb-6 relative">
        <textarea
          className="w-full resize-none outline-none text-sm leading-relaxed"
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
            minHeight: '120px'
          }}
          placeholder="Paste text, code, or information here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex justify-between items-center border-t border-white/5 pt-3">
           <div className="text-xs text-white/40">
             {isEncryptionEnabled ? '🔒 End-to-end encrypted' : '⚠️ Unencrypted'}
           </div>
           <button
             className="btn-primary"
             style={{ width: 'auto', padding: '8px 16px' }}
             onClick={handleShare}
             disabled={!inputText.trim()}
           >
             Share Clipboard
           </button>
        </div>
        
        {/* Sensitive Warning Overlay */}
        {sensitiveWarning && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10 animation-fade-in">
             <AlertTriangle size={32} className="text-warning mb-3" />
             <h3 className="font-display font-bold text-lg mb-2">Potential Sensitive Information</h3>
             <p className="text-sm text-white/60 mb-4">
               We detected: {sensitiveWarning.matches.map(m => m.label).join(', ')}.
             </p>
             <div className="flex gap-3">
               <button className="btn-secondary" onClick={cancelShareSensitive}>Cancel</button>
               <button className="btn-danger text-white bg-warning/20 border-warning/30 hover:bg-warning/30" onClick={confirmShareSensitive}>
                 Share Anyway
               </button>
             </div>
          </div>
        )}
      </div>

      {/* Search and History */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            className="input-field pl-9 py-2"
            placeholder="Search clipboard..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4" style={{ minHeight: 0 }}>
        {filteredItems.length === 0 ? (
          <div className="text-center text-sm text-white/40 mt-8">
            {items.length === 0 ? 'Clipboard history is empty.' : 'No matching items found.'}
          </div>
        ) : (
          filteredItems.map(item => (
            <ClipboardEntry
              key={item.id}
              item={item}
              onDelete={() => onDelete(item.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ClipboardEntry({ item, onDelete }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(item.content)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="clipboard-entry flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs text-white/40">
        <span>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span className="mx-2">•</span>
          {item.sender_name}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Copy"
          >
            {copied ? <span className="text-accent-secondary">Copied</span> : <Copy size={14} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-error/20 hover:text-error rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="font-mono text-sm whitespace-pre-wrap word-break">
        {item.content}
      </div>
    </div>
  )
}
