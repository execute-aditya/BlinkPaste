import { useState } from 'react'

export default function MessageInput({ onSend, isLoading }) {
  const [text, setText] = useState('')

  const handleSend = (e) => {
    e?.preventDefault()
    if (!text.trim() || isLoading) return
    onSend(text.trim())
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="glass-card flex items-end gap-3 p-2 sticky bottom-4 z-10"
      style={{
        marginTop: 'auto',
        borderRadius: '24px', // More pill-shaped for chat
      }}
    >
      <textarea
        className="input-field flex-1"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '10px 14px',
          fontFamily: 'Inter',
          fontSize: '14px',
          minHeight: '44px',
          maxHeight: '120px',
          resize: 'none',
        }}
        rows={1}
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={!text.trim() || isLoading}
        style={{
          width: '44px',
          height: '44px',
          minWidth: '44px',
          borderRadius: '50%',
          background: text.trim() && !isLoading ? '#E8FF47' : 'rgba(255,255,255,0.1)',
          color: text.trim() && !isLoading ? '#08080E' : '#6B6A7A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: text.trim() && !isLoading ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          border: 'none',
          marginBottom: '2px', // Align with textarea base
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: 'translateX(2px) translateY(-1px)' }} // Visual center adjustment for paper plane
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}
