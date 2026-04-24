import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProjectDashboard } from '../../api/projects'
import type { ProjectDashboardResponse } from '../../types'
import { handleApiError } from '../../utils/error'

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString()
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams()
  const [data, setData] = useState<ProjectDashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!projectId) return
    setError(null)
    try {
      const payload = await getProjectDashboard(projectId)
      setData(payload)
    } catch (err) {
      const handled = handleApiError(err)
      setError(handled.inlineMessage ?? handled.toastMessage)
    }
  }

  useEffect(() => {
    void refresh()
  }, [projectId])

  const sortedCommits = useMemo(
    () => (data?.commits ?? []).slice().sort((a, b) => b.timestamp - a.timestamp),
    [data],
  )

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', padding: 28, fontFamily: 'var(--ui)' }}>
      <main style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 38 }}>
              {data?.project.name ?? 'Project'}
            </h1>
            {data ? (
              <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>
                {data.project.join_code} · {data.project.student_count} students · {data.project.commit_count} commits
              </p>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/dashboard" style={{ border: '1px solid var(--ink)', padding: '8px 12px', textDecoration: 'none', color: 'var(--ink)' }}>
              Projects
            </Link>
            <button type="button" onClick={() => { void refresh() }} style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: '8px 12px' }}>
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <div style={{ border: '1px solid var(--signal)', color: 'var(--signal)', padding: 12, marginBottom: 14 }}>{error}</div>
        ) : null}

        <section style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          <aside style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14 }}>
            <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Contributors</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {(data?.students ?? []).map((student) => (
                <Link
                  key={student.student_id}
                  to={`/dashboard/${projectId}/${encodeURIComponent(student.student_id)}`}
                  style={{ textDecoration: 'none', color: 'var(--ink)', border: '1px solid var(--paper-line)', padding: 10 }}
                >
                  <div style={{ fontWeight: 600 }}>{student.student_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    {student.total_commits} commits · {student.total_lines_added} lines
                  </div>
                </Link>
              ))}
            </div>
          </aside>

          <div style={{ display: 'grid', gap: 16 }}>
            <section style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14 }}>
              <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Commit timeline</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {sortedCommits.map((commit) => (
                  <article key={commit.commit_id} style={{ border: '1px solid var(--paper-line)', padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <strong>{commit.student_id}</strong>
                      <span style={{ color: 'var(--ink-muted)' }}>{formatTime(commit.timestamp)}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 14 }}>{commit.commit_message || '(no message)'}</div>
                    <div style={{ marginTop: 5, fontSize: 12, color: 'var(--ink-muted)' }}>
                      {commit.commit_hash || 'no-hash'} · Fc {commit.fc_score} · {commit.difficulty} · {commit.puzzle_result}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14 }}>
              <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Participation breakdown</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--paper-line)', padding: '6px 4px' }}>Student</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--paper-line)', padding: '6px 4px' }}>BACKEND</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--paper-line)', padding: '6px 4px' }}>UI</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--paper-line)', padding: '6px 4px' }}>DATABASE</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--paper-line)', padding: '6px 4px' }}>TESTING</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--paper-line)', padding: '6px 4px' }}>INFRA</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid var(--paper-line)', padding: '6px 4px' }}>SYSTEM_DESIGN</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.students ?? []).map((student) => (
                    <tr key={student.student_id}>
                      <td style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>{student.student_id}</td>
                      <td style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>{student.category_breakdown.BACKEND ?? 0}%</td>
                      <td style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>{student.category_breakdown.UI ?? 0}%</td>
                      <td style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>{student.category_breakdown.DATABASE ?? 0}%</td>
                      <td style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>{student.category_breakdown.TESTING ?? 0}%</td>
                      <td style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>{student.category_breakdown.INFRA ?? 0}%</td>
                      <td style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>{student.category_breakdown.SYSTEM_DESIGN ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}
