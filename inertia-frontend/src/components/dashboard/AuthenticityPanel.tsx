import type { AuthenticityRecord } from '../../types'

interface Props {
  records: AuthenticityRecord[]
}

export function AuthenticityPanel({ records }: Props) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>
        Authenticity Index — flagged if Fc&gt;30 and solve&lt;10s
      </div>

      {records.length === 0 ? (
        <div style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontSize: 11 }}>No authenticity data yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--ui)', fontSize: 12 }}>
            <thead>
              <tr>
                {['Student', 'Fc Score', 'Solve Time', 'Result'].map((h) => (
                  <th key={h} style={{
                    padding: '6px 12px', textAlign: 'left', borderBottom: '1px solid var(--ink)',
                    background: 'var(--paper-2)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr
                  key={r.student_id}
                  style={{
                    borderBottom: '1px solid var(--paper-line)',
                    background: r.flag
                      ? 'rgba(215,64,44,0.08)'
                      : i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)',
                  }}
                >
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.student_id}</td>
                  <td style={{ padding: '8px 12px' }}>{r.fc_score}</td>
                  <td style={{ padding: '8px 12px' }}>{r.solve_time_seconds.toFixed(1)}s</td>
                  <td style={{ padding: '8px 12px' }}>
                    {r.flag
                      ? <span style={{ color: 'var(--signal)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em' }}>⚠ SUSPICIOUS</span>
                      : <span style={{ color: 'var(--pass)', fontSize: 10, letterSpacing: '0.1em' }}>✓ OK</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
