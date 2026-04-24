interface LiveIndicatorProps {
  connected: boolean
}

export function LiveIndicator({ connected }: LiveIndicatorProps) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      border: '1px solid var(--ink)',
      padding: '4px 10px',
      fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
      background: 'var(--paper)',
    }}>
      {connected
        ? <span className="dot-live" />
        : <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--ink-faint)' }} />
      }
      {connected ? 'Live' : 'Polling'}
    </div>
  )
}
