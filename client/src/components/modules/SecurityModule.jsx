import { CheckCircle2, AlertOctagon, Info, Shield, ShieldAlert, KeyRound } from 'lucide-react'

/**
 * SecurityModule
 * Audit log and security status dashboard.
 */
export default function SecurityModule({ events, stats, config }) {
  return (
    <div className="module-container h-full flex flex-col">
      <div className="module-header shrink-0">
        <h2 className="module-title">Security Center</h2>
        <p className="module-subtitle">Session security audit and configuration</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2" style={{ minHeight: 0 }}>
        {/* Active Defenses */}
        <div className="glass-card mb-6">
          <div className="px-5 py-4 border-b border-white/5 font-semibold text-sm">
            Active Defenses
          </div>
          <div className="flex flex-col">
            <SecurityConfigItem 
              label="End-to-End Encryption" 
              active={config.encryption} 
              description="Data is encrypted locally before transmission" 
            />
            <SecurityConfigItem 
              label="Passcode Authentication" 
              active={config.authentication} 
              description="Cryptographic hashing for session access" 
            />
            <SecurityConfigItem 
              label="Brute-Force Protection" 
              active={config.rateLimiting} 
              description="Temporary lockout after 5 failed attempts" 
            />
            <SecurityConfigItem 
              label="Sensitive Content Detection" 
              active={config.sensitiveDetection} 
              description="Local scanning for API keys and tokens" 
            />
            <SecurityConfigItem 
              label="Auto-Destruction" 
              active={config.autoDestruct} 
              description="All data permanently erased on expiry" 
            />
          </div>
        </div>

        {/* Security Events */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Audit Log</h3>
            <span className="text-xs text-white/40">{events.length} Events</span>
          </div>
          
          <div className="glass-card p-4 flex flex-col">
            {events.length === 0 ? (
              <div className="text-center text-sm text-white/40 py-8">
                No security events recorded.
              </div>
            ) : (
              events.map(event => (
                <SecurityEventRow key={event.id} event={event} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SecurityConfigItem({ label, active, description }) {
  return (
    <div className="security-status-item">
      <div>
        <div className="font-medium text-white mb-0.5">{label}</div>
        <div className="text-xs text-white/40">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        {active ? (
          <>
            <span className="text-xs font-medium text-accent-secondary">Active</span>
            <CheckCircle2 size={16} className="text-accent-secondary" />
          </>
        ) : (
          <>
            <span className="text-xs font-medium text-white/40">Disabled</span>
            <AlertOctagon size={16} className="text-white/40" />
          </>
        )}
      </div>
    </div>
  )
}

function SecurityEventRow({ event }) {
  const getEventIcon = () => {
    switch (event.event_type) {
      case 'join': return <Shield size={16} className="text-accent-secondary" />
      case 'leave': return <Info size={16} className="text-white/40" />
      case 'blocked': return <ShieldAlert size={16} className="text-error" />
      case 'secret_created': return <KeyRound size={16} className="text-accent-purple" />
      case 'warning': return <AlertOctagon size={16} className="text-warning" />
      default: return <Info size={16} className="text-white/40" />
    }
  }

  return (
    <div className="security-event">
      <div className="mt-0.5 shrink-0">
        {getEventIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white mb-0.5">{event.description}</div>
        <div className="text-xs text-white/40 flex items-center gap-2">
          <span>{new Date(event.created_at).toLocaleTimeString()}</span>
          {event.device_id && (
            <>
              <span>•</span>
              <span className="truncate max-w-[120px]">Device: {event.device_id.slice(0, 8)}...</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
