import { useCountdown } from '../../hooks/useCountdown'
import { formatSeconds } from '../../utils/format'

interface LockoutOverlayProps {
  lockoutSeconds: number
  onExpire: () => void
}

export function LockoutOverlay({ lockoutSeconds, onExpire }: LockoutOverlayProps) {
  const remaining = useCountdown(lockoutSeconds, onExpire)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(14,14,12,0.75)',
    }}>
      <div style={{
        background: 'var(--paper)', border: '2px solid var(--signal)',
        boxShadow: '8px 8px 0 var(--signal)',
        padding: '0', maxWidth: 420, width: '90%', textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Alarm bar */}
        <div className="alarm-bar" style={{ height: 8 }} />
        <div style={{ padding: '28px 28px 32px' }}>
          <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--signal)', marginBottom: 12 }}>
            Reflection period
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 72, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--signal)', fontVariantNumeric: 'tabular-nums' }}>
            {formatSeconds(remaining)}
          </div>
          <p style={{ fontFamily: 'var(--ui)', fontSize: 12, color: 'var(--ink-muted)', marginTop: 16, lineHeight: 1.6 }}>
            Think about where your reasoning went wrong.
            <br />A new puzzle will be issued when the timer expires.
          </p>
        </div>
        <div className="alarm-bar" style={{ height: 8 }} />
      </div>
    </div>
  )
}
