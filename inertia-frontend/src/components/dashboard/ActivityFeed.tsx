import type { ActivityFeedEvent } from '../../types'

interface Props {
  events: ActivityFeedEvent[]
}

function timeAgo(ts: number) {
  const seconds = Math.floor(Date.now() / 1000 - ts)
  if (seconds < 60) return `${Math.max(0, seconds)}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

export function ActivityFeed({ events }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>
        Class Activity Stream
      </div>

      {events.length === 0 ? (
        <div style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontSize: 11 }}>No activity yet.</div>
      ) : (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: 250,
          background: 'var(--paper-2)',
          border: '1px solid var(--paper-line)',
          padding: 10,
          fontFamily: 'var(--ui)',
          fontSize: 10
        }}>
          {events.map((event, i) => (
            <div key={`${event.timestamp}-${i}`} style={{
              display: 'flex',
              gap: 8,
              padding: '6px 0',
              borderBottom: i === events.length - 1 ? 'none' : '1px solid var(--paper-line)'
            }}>
              <div style={{ color: 'var(--ink-muted)', minWidth: 50 }}>
                {timeAgo(event.timestamp)}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{event.student_id}</span>
                {' '}
                <span style={{ color: event.success ? 'var(--pass)' : 'var(--signal)' }}>
                  {event.success ? 'solved' : 'failed'}
                </span>
                {' '}a{' '}
                <span style={{ fontWeight: 600 }}>{event.difficulty}</span> puzzle in{' '}
                {event.solve_time}s
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
