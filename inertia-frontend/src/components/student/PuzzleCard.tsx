import type { PuzzleResponse } from '../../types'
import { CountdownRing } from './CountdownRing'

interface PuzzleCardProps {
  puzzle: PuzzleResponse
  answer: string
  onAnswerChange: (answer: string) => void
  onSubmit: () => void
  remainingSeconds: number
  disabled: boolean
}

export function PuzzleCard({ puzzle, answer, onAnswerChange, onSubmit, remainingSeconds, disabled }: PuzzleCardProps) {
  const urgent = remainingSeconds > 0 && remainingSeconds <= 30

  return (
    <div style={{
      border: `2px solid ${urgent ? 'var(--signal)' : 'var(--ink)'}`,
      boxShadow: `4px 4px 0 ${urgent ? 'var(--signal)' : 'var(--ink)'}`,
      transition: 'border-color .3s, box-shadow .3s',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: `1px solid ${urgent ? 'var(--signal)' : 'var(--ink)'}`,
        background: urgent ? 'rgba(215,64,44,0.08)' : 'var(--paper-2)',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            Proof-of-Thought puzzle
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontStyle: 'italic', marginTop: 2 }}>
            {puzzle.function_name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {puzzle.timer_seconds > 0 && (
            <CountdownRing totalSeconds={puzzle.timer_seconds} remainingSeconds={remainingSeconds} />
          )}
        </div>
      </div>

      {/* Setup */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--paper-line)', background: 'var(--paper)' }}>
        <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
          Setup
        </div>
        <pre style={{
          fontFamily: 'var(--ui)', fontSize: 12, lineHeight: 1.65,
          background: 'var(--paper-2)', padding: '14px 16px',
          borderLeft: '3px solid var(--ink)',
          color: 'var(--ink-2)', whiteSpace: 'pre-wrap', margin: 0,
          overflowX: 'auto',
        }}>
          {puzzle.setup}
        </pre>
      </div>

      {/* Question */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--paper-line)', background: 'var(--paper)' }}>
        <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
          Question
        </div>
        <p style={{ fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0 }}>
          {puzzle.question}
        </p>
      </div>

      {/* Answer */}
      <div style={{ padding: '16px', background: 'var(--paper)' }}>
        <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
          Your answer
        </div>
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={disabled}
          placeholder="Explain your reasoning..."
          rows={4}
          style={{
            width: '100%', boxSizing: 'border-box',
            fontFamily: 'var(--ui)', fontSize: 13,
            border: '1px solid var(--ink)',
            background: disabled ? 'var(--paper-2)' : 'var(--paper)',
            padding: '10px 12px', resize: 'vertical',
            outline: 'none', color: 'var(--ink)',
          }}
          onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--caution)' }}
          onBlur={e => { e.currentTarget.style.boxShadow = 'none' }}
        />
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !answer.trim()}
            style={{
              border: '1px solid var(--ink)',
              background: disabled || !answer.trim() ? 'var(--paper-2)' : 'var(--ink)',
              color: disabled || !answer.trim() ? 'var(--ink-muted)' : 'var(--paper)',
              padding: '8px 20px', fontFamily: 'var(--ui)', fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'background .1s, transform .1s',
            }}
            onMouseEnter={e => {
              if (!disabled && answer.trim()) {
                (e.currentTarget as HTMLElement).style.background = 'var(--caution)';
                (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0 var(--ink)';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = disabled || !answer.trim() ? 'var(--paper-2)' : 'var(--ink)';
              (e.currentTarget as HTMLElement).style.color = disabled || !answer.trim() ? 'var(--ink-muted)' : 'var(--paper)';
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
          >
            Verify answer →
          </button>
        </div>
      </div>
    </div>
  )
}
