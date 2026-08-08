import { useState, useRef, useEffect } from 'react'
import { Flame, Trash2, Search, EyeOff, SearchX } from 'lucide-react'

/**
 * MessagesModule
 * Refactored from v1 MessageFeed + MessageInput, adds burn-after-reading.
 */
export default function MessagesModule({ messages, myName, onSend, onDelete, onBurn }) {
  const [inputText, setInputText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [burnType, setBurnType] = useState('none') // none, 1view, 5min
  const feedRef = useRef(null)

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    if (feedRef.current && !searchTerm) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages, searchTerm])

  const handleSend = () => {
    if (!inputText.trim()) return
    onSend(inputText, burnType)
    setInputText('')
  }

  return (
    <div className="module-container h-full flex flex-col">
      <div className="module-header shrink-0 flex justify-between items-center">
        <div>
          <h2 className="module-title">Messages</h2>
          <p className="module-subtitle">Encrypted real-time chat</p>
        </div>
        
        <div className="relative w-48 hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            className="input-field pl-9 py-2 text-xs"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto flex flex-col gap-4 py-2 pr-2"
        style={{ minHeight: 0 }}
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3">
            {searchTerm ? <SearchX size={32} /> : <MessageSquareIcon />}
            <p className="text-sm">
              {searchTerm ? 'No messages found.' : 'No messages yet.'}
            </p>
          </div>
        ) : (
          filteredMessages.map(msg => (
            <MessageCard 
              key={msg.id} 
              msg={msg} 
              myName={myName} 
              onDelete={() => onDelete(msg.id)}
              onBurn={() => onBurn(msg.id)}
            />
          ))
        )}
      </div>

      <div className="shrink-0 pt-4">
        <div className="glass-card p-2 flex flex-col gap-2 rounded-2xl">
          <div className="flex justify-between items-center px-3 pt-1">
            <select 
              value={burnType}
              onChange={(e) => setBurnType(e.target.value)}
              className="bg-transparent text-xs text-white/60 outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="none" className="bg-bg">Standard Message</option>
              <option value="1view" className="bg-bg">Burn after 1 view</option>
              <option value="5min" className="bg-bg">Burn after 5 minutes</option>
            </select>
            {burnType !== 'none' && <Flame size={14} className="text-warning animate-pulse" />}
          </div>
          
          <div className="flex items-end gap-2 px-1 pb-1">
            <textarea
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm px-3 py-2 text-white placeholder-white/30"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              rows={1}
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-1"
              style={{
                background: inputText.trim() ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                color: inputText.trim() ? '#08080E' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageCard({ msg, myName, onDelete, onBurn }) {
  const isMine = msg.sender_name === myName
  const isBurned = msg.burn_type === '1view' && msg.view_count > 0 && !isMine

  // Record view on mount if burnable
  useEffect(() => {
    if (msg.burn_type === '1view' && msg.view_count === 0 && !isMine) {
      onBurn()
    }
  }, [])

  if (isBurned) {
    return (
      <div className={`flex flex-col max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
        <div className="message-bubble-other flex items-center gap-2 opacity-50 italic">
          <EyeOff size={14} />
          Message destroyed
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col max-w-[80%] group ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
      <span className="text-[11px] text-white/40 mb-1 px-1">
        {isMine ? 'You' : msg.sender_name}
        {msg.burn_type !== 'none' && <Flame size={10} className="inline ml-1 text-warning" />}
      </span>
      
      <div className="flex items-center gap-2">
        {isMine && (
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-error transition-all">
            <Trash2 size={14} />
          </button>
        )}
        
        <div className={isMine ? 'message-bubble-mine' : 'message-bubble-other'}>
          {msg.content}
        </div>
        
        {!isMine && (
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-error transition-all">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      
      <span className="text-[10px] text-white/30 mt-1 px-1">
        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

function MessageSquareIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translate(1px, -1px)' }}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
