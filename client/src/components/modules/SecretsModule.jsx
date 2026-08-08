import { useState } from 'react'
import { Plus, Eye, Trash2, Flame, EyeOff } from 'lucide-react'

/**
 * SecretsModule
 * For sharing temporary sensitive data with burn-after-reading.
 */
export default function SecretsModule({ secrets, myName, onCreate, onReveal, onDestroy }) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="module-container h-full flex flex-col relative">
      <div className="module-header shrink-0 flex justify-between items-start">
        <div>
          <h2 className="module-title">Secure Secrets</h2>
          <p className="module-subtitle">Share sensitive data that self-destructs</p>
        </div>
        <button 
          className="btn-primary flex items-center gap-2" 
          style={{ width: 'auto', padding: '10px 16px' }}
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} />
          Create Secret
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4" style={{ minHeight: 0 }}>
        {secrets.length === 0 ? (
          <div className="text-center text-sm text-white/40 mt-12 flex flex-col items-center gap-3">
            <Flame size={32} />
            <p>No secrets shared yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secrets.map(secret => (
              <SecretCard 
                key={secret.id} 
                secret={secret} 
                myName={myName}
                onReveal={(val) => onReveal(secret.id, val)}
                onDestroy={() => onDestroy(secret.id)} 
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateSecretModal 
          onClose={() => setShowCreate(false)} 
          onSubmit={(data) => { onCreate(data); setShowCreate(false) }} 
        />
      )}
    </div>
  )
}

function SecretCard({ secret, myName, onReveal, onDestroy }) {
  const [revealedContent, setRevealedContent] = useState(null)
  
  const isCreator = secret.created_by === myName
  const isTimeExpired = secret.expires_at ? new Date(secret.expires_at) < new Date() : false
  const isViewExpired = secret.burn_type === '1view' ? (secret.view_count >= (secret.max_views || 1)) : false
  const isBurned = isViewExpired || isTimeExpired

  const handleReveal = async () => {
    await onReveal(secret.view_count || 0)
    setRevealedContent(secret.content)
  }

  if (isBurned && !isCreator) {
    return (
      <div className="secret-card opacity-50 flex flex-col items-center justify-center p-6 text-center gap-2 h-full min-h-[140px]">
        <EyeOff size={24} className="text-white/40" />
        <span className="text-sm font-medium">Secret Destroyed</span>
      </div>
    )
  }

  return (
    <div className="secret-card flex flex-col h-full min-h-[140px]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-white mb-1">{secret.title}</h3>
          <p className="text-xs text-white/40">Created by {isCreator ? 'You' : secret.created_by}</p>
        </div>
        <div className="badge badge-purple">
          <Flame size={12} />
          {secret.burn_type === '1view' ? '1 View' : 
           secret.burn_type === '5min' ? '5 Min' : 
           secret.burn_type === '15min' ? '15 Min' : 'Session'}
        </div>
      </div>

      <div className="mt-auto pt-4 flex gap-2">
        {!revealedContent ? (
          <button 
            className="flex-1 btn-secondary flex items-center justify-center gap-2 bg-white/5 border-white/10 hover:bg-white/10"
            onClick={handleReveal}
            disabled={isBurned}
          >
            <Eye size={14} />
            {isCreator ? 'View' : 'Reveal'}
          </button>
        ) : (
          <div className="flex-1 bg-black/40 rounded-lg p-3 font-mono text-sm break-all border border-white/5">
            {revealedContent}
          </div>
        )}
        
        {isCreator && (
          <button 
            className="w-10 shrink-0 btn-danger flex items-center justify-center p-0"
            onClick={onDestroy}
            title="Destroy Secret"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      {revealedContent && !isCreator && secret.burn_type === '1view' && (
        <div className="mt-3 text-[10px] text-warning text-center animate-pulse">
          This secret will be destroyed when you close it.
        </div>
      )}
    </div>
  )
}

function CreateSecretModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [burnType, setBurnType] = useState('1view')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    
    // Convert minutes based on burn type
    let maxViews = 1000 // practically infinite for time-based
    let burnMinutes = null
    
    if (burnType === '1view') maxViews = 1
    if (burnType === '5min') burnMinutes = 5
    if (burnType === '15min') burnMinutes = 15

    onSubmit({ title, content, burnType, maxViews, burnMinutes })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-card w-full max-w-md p-6 animate-modal-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display font-bold">Create Secret</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><EyeOff size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-white/60 mb-2">Title</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Production API Key" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-2">Secret Content</label>
            <textarea 
              className="input-field font-mono" 
              style={{ minHeight: '100px', resize: 'none' }}
              placeholder="Paste secret data here..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-2">Destroy After</label>
            <select 
              className="select-field"
              value={burnType}
              onChange={(e) => setBurnType(e.target.value)}
            >
              <option value="1view">1 view (Burn immediately)</option>
              <option value="5min">5 minutes</option>
              <option value="15min">15 minutes</option>
              <option value="session">Session expiry</option>
            </select>
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={!title.trim() || !content.trim()}>
              Create Securely
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
