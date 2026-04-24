import type { AttemptLogEntry } from '../../types'

interface AttemptTimelineProps {
  attempts: AttemptLogEntry[]
}

export function AttemptTimeline({ attempts }: AttemptTimelineProps) {
  if (attempts.length === 0) {
    return (
      <div style={{
        border: '1px solid var(--paper-line)', background: 'var(--paper-2)',
        padding: '12px', fontFamily: 'var(--ui)', fontSize: 11, color: 'var(--ink-muted)',
        fontStyle: 'italic',
      }}>
        No attempts recorded yet.
      </div>
    )
  }

  const width = 340
  const height = 100
  const xStart = 24
  const xEnd = width - 24
  const top = 18
  const bottom = 76

  const points = attempts.map((entry, index) => {
    const ratio = attempts.length === 1 ? 0.5 : index / (attempts.length - 1)
    const x = xStart + ratio * (xEnd - xStart)
    const y = entry.success ? top : bottom
    return `${x},${y}`
  })

  return (
    <div style={{ border: '1px solid var(--paper-line)', background: 'var(--paper-2)', padding: 12 }}>
      <svg width={width} height={height} style={{ maxWidth: '100%' }} role="img">
        <title>Attempt timeline</title>
        {/* success rail */}
        <line x1={xStart} y1={top} x2={xEnd} y2={top} stroke="var(--paper-line)" strokeWidth={1} strokeDasharray="3 3" />
        {/* fail rail */}
        <line x1={xStart} y1={bottom} x2={xEnd} y2={bottom} stroke="var(--paper-line)" strokeWidth={1} strokeDasharray="3 3" />
        <polyline points={points.join(' ')} fill="none" stroke="var(--ink-muted)" strokeWidth={1.5} />
        {attempts.map((entry, index) => {
          const ratio = attempts.length === 1 ? 0.5 : index / (attempts.length - 1)
          const x = xStart + ratio * (xEnd - xStart)
          const y = entry.success ? top : bottom
          return (
            <rect
              key={`${entry.timestamp}-${index}`}
              x={x - 3} y={y - 3} width={6} height={6}
              fill={entry.success ? 'var(--pass)' : 'var(--signal)'}
              stroke="var(--ink)" strokeWidth={0.5}
            />
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 4 }}>
        <span style={{ color: 'var(--pass)' }}>■ Pass</span>
        <span style={{ color: 'var(--signal)' }}>■ Fail</span>
      </div>
    </div>
  )
}
