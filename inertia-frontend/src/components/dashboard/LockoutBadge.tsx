import { useCountdown } from '../../hooks/useCountdown'
import { formatSeconds } from '../../utils/format'

interface LockoutBadgeProps {
  lockoutSeconds: number
}

const noop = () => {}

export function LockoutBadge({ lockoutSeconds }: LockoutBadgeProps) {
  const remaining = useCountdown(Math.max(0, lockoutSeconds), noop)

  if (remaining <= 0) {
    return <span style={{ color: 'var(--ink-faint)' }}>—</span>
  }

  return (
    <span style={{
      fontFamily: 'var(--ui)', fontSize: 11, fontWeight: 600,
      color: 'var(--ink)', background: 'var(--caution)',
      padding: '2px 6px', border: '1px solid var(--ink)',
    }}>
      {formatSeconds(remaining)}
    </span>
  )
}
