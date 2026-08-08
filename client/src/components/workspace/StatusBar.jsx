import { Lock, Wifi, Clock } from 'lucide-react'
import TimerBar from '../TimerBar'

/**
 * StatusBar — Bottom bar showing encryption status, device count, and session timer.
 *
 * @param {{ encrypted: boolean, deviceCount: number, expiresAt: Date|null, onExpire: () => void }} props
 */
export default function StatusBar({ encrypted, deviceCount, expiresAt, onExpire }) {
  return (
    <div className="workspace-statusbar">
      {/* Left: encryption status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Lock size={12} style={{ color: encrypted ? '#4FFFB0' : '#6B6A7A' }} />
          <span style={{ color: encrypted ? '#4FFFB0' : '#6B6A7A' }}>
            {encrypted ? 'Encrypted Session' : 'Unencrypted'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Wifi size={12} />
          <span>{deviceCount} {deviceCount === 1 ? 'Device' : 'Devices'} Connected</span>
        </div>
      </div>

      {/* Right: timer */}
      <div className="flex items-center gap-1.5">
        <Clock size={12} />
        <TimerBar expiresAt={expiresAt} onExpire={onExpire} />
      </div>
    </div>
  )
}
