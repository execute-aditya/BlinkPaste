import { useEffect, useRef, useState } from 'react'

function MessageCard({ msg, myName }) {
  const isMine = msg.sender_name === myName
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(msg.content)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = msg.content
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div
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

      {/* Message Bubble & Action Button */}
      <div className="relative flex items-center gap-2 max-w-full group">
        {isMine && (
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 shrink-0 cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-[#4fffb0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-2 4h10m-5-5v10" />
              </svg>
            )}
          </button>
        )}

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

        {!isMine && (
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 shrink-0 cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? (
              <svg className="w-3.5 h-3.5 text-[#4fffb0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-2 4h10m-5-5v10" />
              </svg>
            )}
          </button>
        )}
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
}

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
      {messages.map((msg) => (
        <MessageCard key={msg.id} msg={msg} myName={myName} />
      ))}
    </div>
  )
}
