import { useEffect, useRef } from 'react'

export default function MessageFeed({ messages, myName }) {
  const feedRef = useRef(null)

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#6B6A7A' }}>
          No messages yet. Be the first to say something!
        </p>
      </div>
    )
  }

  return (
    <div
      ref={feedRef}
      className="flex-1 overflow-y-auto flex flex-col gap-4 py-2"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.1) transparent',
      }}
    >
      {messages.map((msg) => {
        const isMine = msg.sender_name === myName

        return (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[80%] ${
              isMine ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            {/* Sender Name */}
            <span
              style={{
                fontFamily: 'Inter',
                fontSize: '11px',
                color: '#6B6A7A',
                marginBottom: '4px',
                padding: '0 4px',
              }}
            >
              {isMine ? 'You' : msg.sender_name}
            </span>

            {/* Message Bubble */}
            <div
              style={{
                background: isMine ? '#E8FF47' : 'rgba(255,255,255,0.06)',
                color: isMine ? '#08080E' : '#EEEDF5',
                padding: '10px 14px',
                borderRadius: '16px',
                borderBottomRightRadius: isMine ? '4px' : '16px',
                borderBottomLeftRadius: !isMine ? '4px' : '16px',
                fontFamily: 'Inter',
                fontSize: '14px',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                backdropFilter: isMine ? 'none' : 'blur(10px)',
                border: isMine ? 'none' : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {msg.content}
            </div>

            {/* Timestamp */}
            <span
              style={{
                fontFamily: 'Inter',
                fontSize: '10px',
                color: '#4B4A5A',
                marginTop: '4px',
                padding: '0 4px',
              }}
            >
              {new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
