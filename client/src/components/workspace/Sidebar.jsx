import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clipboard,
  MessageSquare,
  FolderOpen,
  KeyRound,
  Smartphone,
  Shield,
  Settings,
  Menu,
  X,
  Info,
  Code2,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'clipboard', label: 'Clipboard', icon: Clipboard },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'secrets', label: 'Secrets', icon: KeyRound },
  { id: 'devices', label: 'Devices', icon: Smartphone },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
]

/**
 * Sidebar — Workspace navigation with module icons and labels.
 * Responsive: fixed overlay on mobile, permanent on desktop.
 *
 * @param {{ activeModule: string, onModuleChange: (id: string) => void, sessionId: string }} props
 */
export default function Sidebar({ activeModule, onModuleChange, sessionId }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSelect = (id) => {
    onModuleChange(id)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed top-3 left-3 z-50 p-2 rounded-lg md:hidden"
        style={{
          background: 'rgba(8,8,14,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#EEEDF5',
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Header / Logo */}
        <div className="sidebar-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#EEEDF5',
                letterSpacing: '-0.01em',
              }}
            >
              BlinkPaste
            </span>
            <span className="cursor-blink" style={{ fontSize: '1.15rem', marginLeft: '1px' }}>
              |
            </span>
          </Link>
          {sessionId && (
            <div
              style={{
                marginTop: '8px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#6B6A7A',
                letterSpacing: '0.08em',
              }}
            >
              Session: {sessionId}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`sidebar-item ${activeModule === item.id ? 'active' : ''}`}
                onClick={() => handleSelect(item.id)}
              >
                <Icon className="icon" size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer links */}
        <div className="sidebar-footer">
          <Link
            to="/about"
            className="sidebar-item"
            style={{ textDecoration: 'none', marginBottom: '2px' }}
          >
            <Info className="icon" size={18} />
            <span>About</span>
          </Link>
          <Link
            to="/developer"
            className="sidebar-item"
            style={{ textDecoration: 'none' }}
          >
            <Code2 className="icon" size={18} />
            <span>Developer</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
