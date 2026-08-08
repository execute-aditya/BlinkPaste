import { Shield, ShieldAlert, Monitor, Smartphone as PhoneIcon, Laptop, MonitorSmartphone, Crown, UserX } from 'lucide-react'

/**
 * DevicesModule
 * Shows connected devices, roles, and allows the host to kick/promote devices.
 */
export default function DevicesModule({ devices, myDeviceId, isHost, onRemoveDevice, onKickDevice, onMakeHost }) {
  const activeDevices = devices.filter(d => !d.is_blocked)
  const hostCount = activeDevices.filter(d => d.role === 'host').length
  const participantCount = activeDevices.length - hostCount

  return (
    <div className="module-container h-full flex flex-col">
      <div className="module-header shrink-0">
        <h2 className="module-title">Connected Devices</h2>
        <p className="module-subtitle">Monitor and manage session access</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
        <div className="stat-card">
          <div className="stat-value text-accent-secondary">{hostCount}</div>
          <div className="stat-label">Hosts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-white">{participantCount}</div>
          <div className="stat-label">Participants</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4" style={{ minHeight: 0 }}>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-2">Active Devices</h3>
        
        {activeDevices.map(device => (
          <DeviceCard 
            key={device.id} 
            device={device} 
            isMe={device.device_id === myDeviceId}
            isHost={isHost}
            onKick={() => onKickDevice(device.id, device.device_id, device.display_name)}
            onMakeHost={() => onMakeHost(device.id, device.device_id)}
          />
        ))}
      </div>
    </div>
  )
}

function DeviceCard({ device, isMe, isHost, onKick, onMakeHost }) {
  const getDeviceIcon = () => {
    if (device.browser?.includes('Mobile') || device.os?.includes('Android') || device.os?.includes('iOS')) {
      return <PhoneIcon size={20} className="text-white/60" />
    }
    if (device.os?.includes('Mac') || device.os?.includes('Windows') || device.os?.includes('Linux') || device.os?.includes('Win')) {
      return <Laptop size={20} className="text-white/60" />
    }
    return <MonitorSmartphone size={20} className="text-white/60" />
  }

  const isDeviceHost = device.role === 'host'

  return (
    <div className="device-card">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 relative">
          {getDeviceIcon()}
          {isDeviceHost && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-bg rounded-full flex items-center justify-center">
              <Shield size={12} className="text-accent-secondary" />
            </div>
          )}
        </div>
        
        <div>
          <div className="font-medium text-white flex items-center gap-2">
            {device.display_name}
            {isMe && <span className="badge badge-green ml-1">You</span>}
          </div>
          <div className="text-xs text-white/40 mt-1">
            {device.browser || 'Unknown Browser'} • {device.os || 'Unknown OS'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`badge ${isDeviceHost ? 'badge-green' : 'badge-purple'}`}>
          {isDeviceHost ? 'Host' : 'Participant'}
        </div>
        
        {/* Host actions on other devices */}
        {isHost && !isMe && !isDeviceHost && (
          <>
            <button 
              className="p-2 rounded-lg text-white/40 hover:text-accent-secondary hover:bg-accent-secondary/10 transition-colors"
              title="Make Host"
              onClick={onMakeHost}
            >
              <Crown size={16} />
            </button>
            <button 
              className="p-2 rounded-lg text-white/40 hover:text-error hover:bg-error/10 transition-colors"
              title="Kick from Session"
              onClick={onKick}
            >
              <UserX size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
