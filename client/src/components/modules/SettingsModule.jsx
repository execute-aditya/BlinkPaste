import { useState } from 'react'
import { Lock, Trash2, Shield, Settings2, Clock, Users } from 'lucide-react'

/**
 * SettingsModule
 * Session configuration and dangerous actions (Host only).
 */
export default function SettingsModule({ 
  session, 
  isHost, 
  onLockSession, 
  onDestroySession,
  onLeaveSession,
  onUpdateSettings 
}) {
  const [config, setConfig] = useState({
    encryption: session.encrypt_content ?? true,
    autoDestruct: session.destroy_on_expire ?? true,
    sensitiveDetection: true,
  })

  const handleToggle = (key) => {
    if (!isHost) return
    const newConfig = { ...config, [key]: !config[key] }
    setConfig(newConfig)
    onUpdateSettings(newConfig)
  }

  return (
    <div className="module-container h-full flex flex-col">
      <div className="module-header shrink-0">
        <h2 className="module-title">Settings</h2>
        <p className="module-subtitle">Session configuration and controls</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2" style={{ minHeight: 0 }}>
        
        {/* General Info */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 font-semibold text-sm mb-4 text-white">
            <Settings2 size={16} className="text-accent-blue" />
            General Information
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Session ID</span>
              <span className="font-mono text-sm">{session.session_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Session Name</span>
              <span className="text-sm">{session.session_name || 'Unnamed Session'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60 flex items-center gap-2"><Clock size={14}/> Duration</span>
              <span className="text-sm">60 Minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60 flex items-center gap-2"><Users size={14}/> Max Devices</span>
              <span className="text-sm">{session.max_devices || 30}</span>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-white">
            <Shield size={16} className="text-accent-secondary" />
            Security Policies
          </div>
          
          <div className="flex flex-col">
            <SettingToggle 
              label="End-to-End Encryption" 
              description="Encrypt all content before sending to server"
              active={config.encryption}
              disabled={true} // Always on for v2
            />
            <SettingToggle 
              label="Sensitive Content Detection" 
              description="Warn before sharing API keys and tokens"
              active={config.sensitiveDetection}
              onClick={() => handleToggle('sensitiveDetection')}
              disabled={!isHost}
            />
            <SettingToggle 
              label="Automatic Data Destruction" 
              description="Erase all data when session expires"
              active={config.autoDestruct}
              disabled={true} // Always on for v2
            />
          </div>
        </div>

        {/* Host Controls */}
        <div className={`glass-card p-5 mb-6 ${isHost ? 'border-error/20' : 'opacity-50 pointer-events-none'}`}>
          <div className={`flex items-center gap-2 font-semibold text-sm mb-4 ${isHost ? 'text-error' : 'text-white/40'}`}>
            <Lock size={16} />
            Host Controls
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              className={`w-full flex items-center justify-center gap-2 ${session.is_locked ? 'btn-primary' : 'btn-secondary'}`}
              onClick={onLockSession}
              disabled={!isHost}
            >
              <Lock size={16} />
              {session.is_locked ? 'Unlock Session' : 'Lock Session'}
            </button>
            <p className="text-xs text-white/40 text-center mb-2">
              {session.is_locked ? 'Session is locked. Click to allow new devices to join.' : 'Prevents any new devices from joining the session.'}
            </p>
            
            <button 
              className="btn-danger w-full flex items-center justify-center gap-2"
              onClick={onDestroySession}
              disabled={!isHost}
            >
              <Trash2 size={16} />
              Destroy Session Now
            </button>
            <p className="text-xs text-white/40 text-center">
              Immediately expires the session and permanently deletes all data.
            </p>
          </div>
        </div>

        {/* Leave Session */}
        <div className="glass-card p-5 mb-6 border-warning/20">
          <div className="flex items-center gap-2 font-semibold text-sm mb-4 text-warning">
            <Shield size={16} />
            Device Controls
          </div>
          <button 
            className="btn-secondary w-full flex items-center justify-center gap-2 text-warning hover:bg-warning/10 hover:border-warning/50"
            onClick={onLeaveSession}
          >
            Leave Session
          </button>
          <p className="text-xs text-white/40 text-center mt-3">
            Disconnect this device from the session. The session will remain active.
          </p>
        </div>

        {!isHost && (
          <div className="text-center text-xs text-warning animate-pulse">
            Only the session host can modify settings or destroy the session.
          </div>
        )}

      </div>
    </div>
  )
}

function SettingToggle({ label, description, active, onClick, disabled }) {
  return (
    <div className="setting-row">
      <div className={disabled ? 'opacity-50' : ''}>
        <div className="text-sm font-medium text-white mb-0.5">{label}</div>
        <div className="text-xs text-white/40">{description}</div>
      </div>
      <button 
        className={`toggle-switch ${active ? 'active' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-checked={active}
        role="switch"
      />
    </div>
  )
}
