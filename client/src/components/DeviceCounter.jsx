/**
 * DeviceCounter — Shows the live count of connected devices.
 * Count is derived from Supabase Presence state in Session.jsx.
 *
 * @param {{ count: number }} props
 */
export default function DeviceCounter({ count }) {
  return (
    <div className="flex items-center gap-2">
      {/* Green indicator dots: one per connected device (max 5 shown) */}
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#4FFFB0',
              opacity: 1 - i * 0.12,
            }}
          />
        ))}
        {count > 5 && (
          <span
            style={{
              fontSize: '9px',
              color: '#4FFFB0',
              fontFamily: 'Inter',
              marginLeft: '2px',
            }}
          >
            +{count - 5}
          </span>
        )}
      </div>

      <span
        style={{
          fontSize: '12px',
          color: '#6B6A7A',
          fontFamily: 'Inter',
          letterSpacing: '0.01em',
        }}
      >
        {count} {count === 1 ? 'device' : 'devices'}
      </span>
    </div>
  )
}
