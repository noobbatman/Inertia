import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProjectDashboard } from '../../api/projects'
import { AuthenticityPanel } from '../../components/dashboard/AuthenticityPanel'
import { StruggleHeatmap } from '../../components/dashboard/StruggleHeatmap'
import type { AuthenticityRecord, HeatmapResponse, ProjectDashboardResponse } from '../../types'
import { handleApiError } from '../../utils/error'

function formatTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString()
}

const PREFERRED_CATEGORY_ORDER = [
  'BACKEND',
  'UI',
  'DATABASE',
  'TESTING',
  'INFRA',
  'SYSTEM_DESIGN',
  'OTHER',
]

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

  const categoryColumns = useMemo(() => {
    const categories = new Set<string>()
    for (const student of data?.students ?? []) {
      for (const category of Object.keys(student.category_breakdown ?? {})) {
        categories.add(category)
      }
    }

    const orderedKnown = PREFERRED_CATEGORY_ORDER.filter((category) => categories.has(category))
    const dynamicUnknown = Array.from(categories)
      .filter((category) => !PREFERRED_CATEGORY_ORDER.includes(category))
      .sort((left, right) => left.localeCompare(right))
    return [...orderedKnown, ...dynamicUnknown]
  }, [data])

  const authenticityRecords = useMemo<AuthenticityRecord[]>(() => {
    const latestByStudent = new Map<string, { fc: number; solve: number; result: boolean | null; flagged: boolean }>()
    for (const commit of sortedCommits) {
      if (latestByStudent.has(commit.student_id)) continue
      const suspicious = commit.fc_score > 30 && commit.solve_time_seconds < 10
      latestByStudent.set(commit.student_id, {
        fc: commit.fc_score,
        solve: commit.solve_time_seconds,
        result: commit.puzzle_result === 'SKIPPED' ? null : commit.puzzle_result === 'PASSED',
        flagged: commit.flagged || suspicious,
      })
    }

    return Array.from(latestByStudent.entries()).map(([studentId, value]) => ({
      student_id: studentId,
      fc_score: value.fc,
      solve_time_seconds: value.solve,
      was_correct: value.result,
      flag: value.flagged,
    }))
  }, [sortedCommits])

  const heatmapData = useMemo<HeatmapResponse>(() => {
    const heatmap: HeatmapResponse['heatmap'] = {}
    for (const student of data?.students ?? []) {
      heatmap[student.student_id] = student.concept_heatmap
    }
    return { heatmap }
  }, [data])

  const flaggedCommits = useMemo(() => {
    return sortedCommits.filter((commit) => commit.flagged || (commit.fc_score > 30 && commit.solve_time_seconds < 10))
  }, [sortedCommits])

  function exportCommitsCsv() {
    if (!data) return
    const headers = [
      'project_id',
      'student_id',
      'timestamp',
      'commit_hash',
      'commit_message',
      'fc_score',
      'difficulty',
      'puzzle_result',
      'solve_time_seconds',
      'flagged',
      'files_changed',
    ]
    const rows = data.commits.map((commit) => [
      commit.project_id,
      commit.student_id,
      new Date(commit.timestamp * 1000).toISOString(),
      commit.commit_hash,
      commit.commit_message,
      String(commit.fc_score),
      commit.difficulty,
      commit.puzzle_result,
      String(commit.solve_time_seconds),
      String(commit.flagged || (commit.fc_score > 30 && commit.solve_time_seconds < 10)),
      commit.diff_summary.files_changed.join(' | '),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${data.project.name.replace(/\s+/g, '_')}_commits.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

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
            <button
              type="button"
              onClick={exportCommitsCsv}
              style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: '8px 12px' }}
            >
              Export CSV
            </button>
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
                    {categoryColumns.map((category) => (
                      <th key={category} style={{ textAlign: 'left', borderBottom: '1px solid var(--paper-line)', padding: '6px 4px' }}>
                        {category}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.students ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(2, categoryColumns.length + 1)} style={{ padding: '10px 4px', color: 'var(--ink-muted)' }}>
                        No participation data yet.
                      </td>
                    </tr>
                  ) : (
                    (data?.students ?? []).map((student) => (
                      <tr key={student.student_id}>
                        <td style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>{student.student_id}</td>
                        {categoryColumns.map((category) => (
                          <td key={`${student.student_id}-${category}`} style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-line)' }}>
                            {student.category_breakdown?.[category] ?? 0}%
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <section style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14 }}>
            <StruggleHeatmap data={heatmapData} />
          </section>
          <section style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14 }}>
            <AuthenticityPanel records={authenticityRecords} />
          </section>
        </section>

        <section style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: 14, marginTop: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Flag history</h2>
          {flaggedCommits.length === 0 ? (
            <div style={{ color: 'var(--ink-muted)' }}>No flagged commits yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {flaggedCommits.map((commit) => (
                <article key={commit.commit_id} style={{ border: '1px solid var(--paper-line)', padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <strong>{commit.student_id}</strong>
                    <span style={{ color: 'var(--ink-muted)' }}>{formatTime(commit.timestamp)}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13 }}>{commit.commit_message || '(no message)'}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--signal)' }}>
                    ⚠ Flag reason: high complexity ({commit.fc_score}) with fast solve ({commit.solve_time_seconds.toFixed(1)}s)
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
