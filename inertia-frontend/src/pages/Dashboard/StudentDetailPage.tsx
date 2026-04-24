import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProjectDashboard, getProjectStudent } from '../../api/projects'
import type { CommitRecord, StudentProfile } from '../../types'
import { handleApiError } from '../../utils/error'

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString()
}

export function StudentDetailPage() {
  const { projectId = '', studentId = '' } = useParams()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [commits, setCommits] = useState<CommitRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!projectId || !studentId) return

    setError(null)
    try {
      const [profile, dashboard] = await Promise.all([
        getProjectStudent(projectId, studentId),
        getProjectDashboard(projectId),
      ])
      setStudent(profile)
      setCommits(dashboard.commits.filter((commit) => commit.student_id === studentId))
    } catch (err) {
      const handled = handleApiError(err)
      setError(handled.inlineMessage ?? handled.toastMessage)
    }
  }

  useEffect(() => {
    void refresh()
  }, [projectId, studentId])

  const sortedCommits = useMemo(
    () => commits.slice().sort((a, b) => b.timestamp - a.timestamp),
    [commits],
  )

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', padding: 28, fontFamily: 'var(--ui)' }}>
      <main style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 38 }}>
              {decodeURIComponent(studentId)}
            </h1>
            {student ? (
              <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>
                {student.total_commits} commits · {student.total_lines_added} lines · {student.puzzle_stats.passed}/{student.puzzle_stats.total} puzzles passed
              </p>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/dashboard/${projectId}`} style={{ border: '1px solid var(--ink)', padding: '8px 12px', textDecoration: 'none', color: 'var(--ink)' }}>
              Back to project
            </Link>
            <button type="button" onClick={() => { void refresh() }} style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: '8px 12px' }}>
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <div style={{ border: '1px solid var(--signal)', color: 'var(--signal)', padding: 12, marginBottom: 14 }}>{error}</div>
        ) : null}

        {student ? (
          <>
            <section style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14, marginBottom: 14 }}>
              <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Contribution profile</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {Object.entries(student.category_breakdown).map(([category, value]) => (
                  <div key={category} style={{ border: '1px solid var(--paper-line)', padding: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{category}</div>
                    <div style={{ fontSize: 22 }}>{value}%</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14, marginBottom: 14 }}>
              <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Concept heatmap</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
                {Object.entries(student.concept_heatmap).map(([concept, data]) => (
                  <div key={concept} style={{ border: '1px solid var(--paper-line)', padding: 10 }}>
                    <div style={{ fontSize: 12 }}>{concept}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      attempts: {data.attempts} · failures: {data.failures}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14 }}>
              <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Commit history</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {sortedCommits.map((commit) => (
                  <article key={commit.commit_id} style={{ border: '1px solid var(--paper-line)', padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <strong>{commit.commit_hash || 'no-hash'}</strong>
                      <span style={{ color: 'var(--ink-muted)' }}>{formatTime(commit.timestamp)}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14 }}>{commit.commit_message || '(no message)'}</div>
                    <div style={{ marginTop: 5, fontSize: 12, color: 'var(--ink-muted)' }}>
                      Fc {commit.fc_score} · {commit.difficulty} · {commit.puzzle_result} · solve {commit.solve_time_seconds}s
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div style={{ color: 'var(--ink-muted)' }}>Loading student view...</div>
        )}
      </main>
    </div>
  )
}
