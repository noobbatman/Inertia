import { useState } from 'react'
import { clearLockout } from '../../api/dashboard'
import { useCountdown } from '../../hooks/useCountdown'
import type { StudentStatus } from '../../types'
import { formatSolveTime, formatTimestamp } from '../../utils/format'
import { AttemptTimeline } from './AttemptTimeline'

interface StudentDrawerProps {
  student: StudentStatus
  onClose: () => void
  onLockoutCleared: (studentId: string) => void
}

const s: Record<string, React.CSSProperties> = {
  label: { fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 4 },
  section: { marginTop: 20 },
  sectionHead: { fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', borderBottom: '1px solid var(--paper-line)', paddingBottom: 6, marginBottom: 10 },
}

export function StudentDrawer({ student, onClose, onLockoutCleared }: StudentDrawerProps) {
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState<string | null>(null)

  const remainingLockout = useCountdown(student.lockout_seconds, () => {})

  const handleClearLockout = async () => {
    setClearing(true)
    setClearError(null)
    try {
      await clearLockout(student.student_id)
      onLockoutCleared(student.student_id)
    } catch {
      setClearError('Failed to clear lockout.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <aside style={{
      position: 'fixed', inset: 0, right: 0, top: 0, bottom: 0,
      width: 380, marginLeft: 'auto',
      overflowY: 'auto',
      background: 'var(--paper)',
      borderLeft: '2px solid var(--ink)',
      boxShadow: '-6px 0 0 var(--ink)',
      padding: '20px 20px 40px',
      zIndex: 50,
      fontFamily: 'var(--ui)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={s.label}>Student</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontStyle: 'italic' }}>
            {student.student_id}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: '1px solid var(--ink)', background: 'var(--paper)',
            padding: '6px 10px', fontFamily: 'var(--ui)', fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Close ✕
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Attempts', val: student.attempt_count },
          { label: 'Failed', val: student.failed_count },
          { label: 'Last Fc', val: student.last_fc_score ?? '—' },
          { label: 'Suspicious', val: student.is_suspicious ? '⚠ Yes' : 'No' },
        ].map(({ label, val }) => (
          <div key={label} style={{ border: '1px solid var(--paper-line)', background: 'var(--paper-2)', padding: '10px 12px' }}>
            <div style={s.label}>{label}</div>
            <div style={{ fontSize: 18, fontFamily: 'var(--serif)', fontStyle: 'italic', color: label === 'Suspicious' && student.is_suspicious ? 'var(--signal)' : 'var(--ink)' }}>
              {String(val)}
            </div>
          </div>
        ))}
      </div>

      {/* Lockout banner */}
      {remainingLockout > 0 && (
        <div style={{
          marginTop: 16,
          border: '1px solid var(--ink)',
          background: 'var(--caution)',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>LOCKED OUT</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>{remainingLockout}s remaining</div>
            </div>
            <button
              type="button"
              onClick={() => { void handleClearLockout() }}
              disabled={clearing}
              style={{
                border: '1px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)',
                padding: '6px 12px', fontFamily: 'var(--ui)', fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                opacity: clearing ? 0.5 : 1,
              }}
            >
              {clearing ? 'Clearing…' : 'Clear lockout'}
            </button>
          </div>
          {clearError && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--signal)' }}>{clearError}</div>}
        </div>
      )}

      {/* Timeline */}
      <div style={s.section}>
        <div style={s.sectionHead}>Attempt timeline</div>
        <AttemptTimeline attempts={student.recent_attempts} />
      </div>

      {/* Attempt list */}
      <div style={s.section}>
        <div style={s.sectionHead}>Recent attempts</div>
        {student.recent_attempts.length === 0 ? (
          <div style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontSize: 11 }}>No recent attempts.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {student.recent_attempts
              .slice()
              .reverse()
              .map((attempt, index) => (
                <div
                  key={`${attempt.timestamp}-${index}`}
                  style={{
                    border: `1px solid ${attempt.success ? 'var(--pass)' : 'var(--paper-line)'}`,
                    background: attempt.success ? 'rgba(45,106,79,0.06)' : 'var(--paper-2)',
                    padding: '8px 10px', fontSize: 11,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-muted)', marginBottom: 4 }}>
                    <span>{formatTimestamp(attempt.timestamp)}</span>
                    <span style={{ color: attempt.success ? 'var(--pass)' : 'var(--signal)', fontWeight: 700 }}>
                      {attempt.success ? '✓ PASS' : '✗ FAIL'}
                    </span>
                  </div>
                  <div>
                    Fc <strong>{attempt.fc_score}</strong> · {formatSolveTime(attempt.solve_time)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </aside>
  )
}
