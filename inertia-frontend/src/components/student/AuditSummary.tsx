import type { AuditResponse } from '../../types'
import { DifficultyBadge } from './DifficultyBadge'

export function AuditSummary({ audit }: { audit: AuditResponse }) {
  const metrics = [
    { label: 'Fc score', value: audit.complexity_score },
    { label: 'Line delta', value: audit.line_delta },
    { label: 'Recursive calls', value: audit.recursive_calls },
    { label: 'Nesting depth', value: audit.nesting_depth },
  ]

  return (
    <div style={{ border: '1px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--ink)',
        background: 'var(--paper-2)',
      }}>
        <span style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
          Audit result
        </span>
        <DifficultyBadge difficulty={audit.difficulty} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: 'var(--paper)' }}>
        {metrics.map((m, i) => (
          <div key={m.label} style={{
            padding: '16px',
            borderRight: i < 3 ? '1px solid var(--paper-line)' : undefined,
          }}>
            <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 36, lineHeight: 1, fontStyle: 'italic' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
      {!audit.requires_puzzle && (
        <div style={{ padding: '10px 16px', background: 'rgba(45,106,79,0.1)', borderTop: '1px solid var(--pass)' }}>
          <span style={{ fontFamily: 'var(--ui)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--pass)', fontWeight: 700 }}>
            ✓ Clean commit — push allowed
          </span>
        </div>
      )}
    </div>
  )
}
