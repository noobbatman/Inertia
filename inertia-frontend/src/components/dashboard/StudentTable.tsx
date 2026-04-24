import { useMemo, useState } from 'react'
import type { StudentStatus } from '../../types'
import { LockoutBadge } from './LockoutBadge'

interface StudentTableProps {
  students: StudentStatus[]
  onSelect: (student: StudentStatus) => void
}

type SortKey = 'student_id' | 'last_fc_score' | 'attempt_count' | 'failed_count' | 'lockout_seconds' | 'is_suspicious'
type SortDirection = 'asc' | 'desc'

function getComparableValue(student: StudentStatus, key: SortKey) {
  switch (key) {
    case 'student_id': return student.student_id.toLowerCase()
    case 'last_fc_score': return student.last_fc_score ?? -1
    case 'attempt_count': return student.attempt_count
    case 'failed_count': return student.failed_count
    case 'lockout_seconds': return student.lockout_seconds
    case 'is_suspicious': return student.is_suspicious ? 1 : 0
  }
}

const MAX_FC = 100

function FcBar({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: 'var(--ink-faint)' }}>—</span>
  const pct = Math.min(100, (score / MAX_FC) * 100)
  const color = score > 45 ? 'var(--signal)' : score > 25 ? 'var(--caution)' : 'var(--pass)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 60, height: 6, background: 'var(--paper-2)', border: '1px solid var(--paper-line)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontFamily: 'var(--ui)', fontSize: 11 }}>{score}</span>
    </div>
  )
}

export function StudentTable({ students, onSelect }: StudentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('student_id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const sortedStudents = useMemo(() => {
    const copy = [...students]
    copy.sort((a, b) => {
      const av = getComparableValue(a, sortKey)
      const bv = getComparableValue(b, sortKey)
      if (av === bv) return 0
      const cmp = av > bv ? 1 : -1
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return copy
  }, [sortDirection, sortKey, students])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const thStyle: React.CSSProperties = {
    fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: 'var(--ink-muted)',
    padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--ink)',
    background: 'var(--paper-2)',
    cursor: 'pointer', userSelect: 'none',
    whiteSpace: 'nowrap',
  }

  const sortArrow = (key: SortKey) => sortKey === key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div style={{ border: '1px solid var(--ink)', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--ui)', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={thStyle} onClick={() => toggleSort('student_id')}>ID{sortArrow('student_id')}</th>
            <th style={thStyle} onClick={() => toggleSort('last_fc_score')}>Fc Score{sortArrow('last_fc_score')}</th>
            <th style={thStyle} onClick={() => toggleSort('attempt_count')}>Attempts{sortArrow('attempt_count')}</th>
            <th style={thStyle} onClick={() => toggleSort('failed_count')}>Failed{sortArrow('failed_count')}</th>
            <th style={thStyle} onClick={() => toggleSort('lockout_seconds')}>Lockout{sortArrow('lockout_seconds')}</th>
            <th style={thStyle} onClick={() => toggleSort('is_suspicious')}>Flag{sortArrow('is_suspicious')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '24px 12px', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                No student activity yet.
              </td>
            </tr>
          ) : (
            sortedStudents.map((student, i) => (
              <tr
                key={student.student_id}
                onClick={() => onSelect(student)}
                style={{
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--paper-line)',
                  background: student.is_suspicious
                    ? 'rgba(215,64,44,0.06)'
                    : i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,196,48,0.18)' }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = student.is_suspicious
                    ? 'rgba(215,64,44,0.06)'
                    : i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)'
                }}
              >
                <td style={{ padding: '9px 12px', fontWeight: 600 }}>{student.student_id}</td>
                <td style={{ padding: '9px 12px' }}><FcBar score={student.last_fc_score} /></td>
                <td style={{ padding: '9px 12px' }}>{student.attempt_count}</td>
                <td style={{ padding: '9px 12px', color: student.failed_count > 0 ? 'var(--signal)' : 'inherit' }}>
                  {student.failed_count}
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <LockoutBadge lockoutSeconds={student.lockout_seconds} />
                </td>
                <td style={{ padding: '9px 12px' }}>
                  {student.is_suspicious
                    ? <span style={{ color: 'var(--signal)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em' }}>⚠ FLAGGED</span>
                    : <span style={{ color: 'var(--ink-faint)' }}>—</span>
                  }
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
