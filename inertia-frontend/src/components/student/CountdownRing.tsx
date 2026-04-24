interface CountdownRingProps {
  totalSeconds: number
  remainingSeconds: number
}

export function CountdownRing({ totalSeconds, remainingSeconds }: CountdownRingProps) {
  const size = 80
  const sw = 8
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const bounded = Math.max(0, Math.min(totalSeconds, remainingSeconds))
  const pct = totalSeconds > 0 ? bounded / totalSeconds : 0
  const offset = circ * (1 - pct)
  const urgent = remainingSeconds <= 30

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-line)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={urgent ? 'var(--signal)' : 'var(--ink)'}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--ui)', fontSize: 14, fontWeight: 700,
        color: urgent ? 'var(--signal)' : 'var(--ink)',
        transition: 'color .3s',
      }}>
        {remainingSeconds}
      </div>
    </div>
  )
}
