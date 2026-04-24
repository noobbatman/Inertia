import type { StudentStatus } from '../../types'

interface StatCardsProps {
  students: StudentStatus[]
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{
      background: 'var(--paper)',
      border: '1px solid var(--ink)',
      boxShadow: '3px 3px 0 var(--ink)',
      padding: '18px 20px',
    }}>
      <div style={{
        fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--serif)', fontSize: 42, lineHeight: 1,
        color: accent ? 'var(--signal)' : 'var(--ink)',
        fontStyle: 'italic',
      }}>
        {value}
      </div>
    </div>
  )
}

export function StatCards({ students }: StatCardsProps) {
  const total = students.length
  const activeLockouts = students.filter((s) => s.lockout_seconds > 0).length
  const suspicious = students.filter((s) => s.is_suspicious).length
  const avgFc = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.last_fc_score ?? 0), 0) / students.length)
    : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      <StatCard label="Students" value={total} />
      <StatCard label="Active Lockouts" value={activeLockouts} accent={activeLockouts > 0} />
      <StatCard label="Suspicious" value={suspicious} accent={suspicious > 0} />
      <StatCard label="Avg Fc Score" value={avgFc} />
    </div>
  )
}
