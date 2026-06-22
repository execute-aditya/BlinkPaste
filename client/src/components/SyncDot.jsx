/**
 * SyncDot — A small pulsing dot that flashes mint green when a
 * text_update broadcast is received, then fades after 800ms.
 * Uses the same blink keyframe as the logo cursor.
 *
 * @param {{ active: boolean }} props
 */
export default function SyncDot({ active }) {
  return (
    <div
      className="relative flex items-center justify-center"
      title={active ? 'Syncing…' : 'In sync'}
    >
      <span
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: active ? '#4FFFB0' : 'rgba(79,255,176,0.2)',
          transition: 'background-color 0.2s ease',
          animation: active ? 'sync-flash 800ms ease-out forwards' : 'none',
        }}
      />
    </div>
  )
}
