import type { DifficultyCell } from '../../types'

const TIERS = ['TRIVIAL', 'EASY', 'MEDIUM', 'HARD']

interface Props {
  data: Record<string, Record<string, DifficultyCell>> | null
}

function cellStyle(attempts: number, successRate: number) {
  if (attempts === 0) return { background: 'var(--paper-2)', color: 'var(--ink-faint)' }
  if (successRate >= 80) return { background: 'rgba(45,106,79,0.25)', color: 'var(--ink)' }
  if (successRate >= 50) return { background: 'rgba(244,196,48,0.4)', color: 'var(--ink)' }
  return { background: 'rgba(215,64,44,0.3)', color: 'var(--ink)' }
}

export function DifficultyMatrix({ data }: Props) {
  const matrix = data ?? {}
  const studentIds = Object.keys(matrix)

  return (
    <div>
      <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>
        Performance Matrix — Success rate / avg time
      </div>

      {studentIds.length === 0 ? (
        <div style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontSize: 11 }}>No data yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontFamily: 'var(--ui)', fontSize: 11, width: '100%' }}>
            <thead>
              <tr>
                <th style={{
                  padding: '5px 10px', textAlign: 'left', borderBottom: '1px solid var(--ink)',
                  background: 'var(--paper-2)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)',
                }}>
                  Student
                </th>
                {TIERS.map((tier) => (
                  <th key={tier} style={{
                    padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid var(--ink)',
                    background: 'var(--paper-2)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-muted)',
                  }}>
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentIds.map((sid, i) => {
                const row = matrix[sid] ?? {}
                return (
                  <tr key={sid} style={{ borderBottom: '1px solid var(--paper-line)', background: i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{sid}</td>
                    {TIERS.map((tier) => {
                      const cell = row[tier] ?? { attempts: 0, successes: 0, success_rate: 0, avg_solve_time: 0 }
                      const style = cellStyle(cell.attempts, cell.success_rate)
                      return (
                        <td key={tier} style={{
                          padding: '6px 8px', textAlign: 'center',
                          border: '1px solid var(--paper-line)',
                          fontSize: 10,
                          ...style
                        }}>
                          {cell.attempts === 0 ? '·' : `${cell.success_rate}% (${cell.avg_solve_time}s)`}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(45,106,79,0.25)', border: '1px solid var(--paper-line)', verticalAlign: 'middle' }} /> ≥80% pass</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(244,196,48,0.4)', border: '1px solid var(--paper-line)', verticalAlign: 'middle' }} /> ≥50% pass</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(215,64,44,0.3)', border: '1px solid var(--paper-line)', verticalAlign: 'middle' }} /> &lt;50% pass</span>
          </div>
        </div>
      )}
    </div>
  )
}
