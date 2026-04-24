import type { Difficulty } from '../../types'

const colorByDifficulty: Record<Difficulty, { bg: string; color: string }> = {
  TRIVIAL: { bg: 'var(--paper-2)', color: 'var(--ink-muted)' },
  EASY:    { bg: 'rgba(45,106,79,0.15)', color: 'var(--pass)' },
  MEDIUM:  { bg: 'rgba(244,196,48,0.3)', color: 'var(--caution-deep)' },
  HARD:    { bg: 'rgba(215,64,44,0.15)', color: 'var(--signal)' },
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { bg, color } = colorByDifficulty[difficulty]
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      background: bg, color,
      border: `1px solid ${color}`,
      fontFamily: 'var(--ui)', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
    }}>
      {difficulty}
    </span>
  )
}
