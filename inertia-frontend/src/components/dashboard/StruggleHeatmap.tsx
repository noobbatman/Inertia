import type { HeatmapResponse } from '../../types'

const CONCEPTS = ['RECURSION', 'DYNAMIC_PROGRAMMING', 'SORTING', 'GRAPHS', 'TREES', 'LOOPS', 'OTHER']

interface Props {
  data: HeatmapResponse | null
}

function cellColor(attempts: number, failures: number) {
  if (attempts === 0) return 'var(--paper-2)'
  if (failures === 0) return 'rgba(45,106,79,0.25)'
  const ratio = failures / attempts
  if (ratio < 0.5) return 'rgba(244,196,48,0.4)'
  if (ratio < 1) return 'rgba(215,64,44,0.3)'
  return 'rgba(215,64,44,0.7)'
}

export function StruggleHeatmap({ data }: Props) {
  const heatmap = data?.heatmap ?? {}
  const studentIds = Object.keys(heatmap)

  return (
    <div>
      <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>
        Struggle Heatmap — failures / attempts per concept
      </div>

      {studentIds.length === 0 ? (
        <div style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontSize: 11 }}>No data yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontFamily: 'var(--ui)', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{
                  padding: '5px 10px', textAlign: 'left', borderBottom: '1px solid var(--ink)',
                  background: 'var(--paper-2)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)',
                }}>
                  Student
                </th>
                {CONCEPTS.map((c) => (
                  <th key={c} style={{
                    padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid var(--ink)',
                    background: 'var(--paper-2)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {c.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentIds.map((sid, i) => {
                const row = heatmap[sid] ?? {}
                return (
                  <tr key={sid} style={{ borderBottom: '1px solid var(--paper-line)', background: i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{sid}</td>
                    {CONCEPTS.map((c) => {
                      const cell = row[c] ?? { attempts: 0, failures: 0 }
                      return (
                        <td key={c} style={{
                          padding: '6px 8px', textAlign: 'center',
                          background: cellColor(cell.attempts, cell.failures),
                          border: '1px solid var(--paper-line)',
                          fontSize: 10,
                          color: cell.attempts === 0 ? 'var(--ink-faint)' : 'var(--ink)',
                        }}>
                          {cell.attempts === 0 ? '·' : `${cell.failures}/${cell.attempts}`}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(45,106,79,0.25)', border: '1px solid var(--paper-line)', verticalAlign: 'middle' }} /> 0 fail</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(244,196,48,0.4)', border: '1px solid var(--paper-line)', verticalAlign: 'middle' }} /> &lt;50%</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(215,64,44,0.3)', border: '1px solid var(--paper-line)', verticalAlign: 'middle' }} /> &lt;100%</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(215,64,44,0.7)', border: '1px solid var(--paper-line)', verticalAlign: 'middle' }} /> all fail</span>
          </div>
        </div>
      )}
    </div>
  )
}
