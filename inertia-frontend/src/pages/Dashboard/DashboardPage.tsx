import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAuthenticity, getStatus } from '../../api/dashboard'
import { getHeatmap } from '../../api/dashboard'
import { AuthenticityPanel } from '../../components/dashboard/AuthenticityPanel'
import { LiveIndicator } from '../../components/dashboard/LiveIndicator'
import { StatCards } from '../../components/dashboard/StatCards'
import { StruggleHeatmap } from '../../components/dashboard/StruggleHeatmap'
import { StudentDrawer } from '../../components/dashboard/StudentDrawer'
import { StudentTable } from '../../components/dashboard/StudentTable'
import { useSSE } from '../../hooks/useSSE'
import type { AuthenticityRecord, DashboardResponse, HeatmapResponse, StudentStatus } from '../../types'
import { handleApiError } from '../../utils/error'

function useClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString())
  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return time
}

export function DashboardPage() {
  const [students, setStudents] = useState<StudentStatus[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('—')
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null)
  const [authenticityRecords, setAuthenticityRecords] = useState<AuthenticityRecord[]>([])

  const stream = useSSE<DashboardResponse>('/dashboard/stream')
  const clock = useClock()

  const refreshStatus = useCallback(async () => {
    setError(null)
    try {
      const [statusRes, heatmapRes, authRes] = await Promise.all([
        getStatus(),
        getHeatmap().catch(() => null),
        getAuthenticity().catch(() => ({ students: [] })),
      ])
      setStudents(statusRes.students)
      if (heatmapRes) setHeatmap(heatmapRes)
      setAuthenticityRecords(authRes.students)
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (err) {
      const handled = handleApiError(err)
      setError(handled.inlineMessage ?? handled.toastMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
    const id = window.setInterval(() => { void refreshStatus() }, 30_000)
    return () => window.clearInterval(id)
  }, [refreshStatus])

  useEffect(() => {
    if (!stream.data) return
    setStudents(stream.data.students)
    setLastRefresh(new Date().toLocaleTimeString())
  }, [stream.data])

  const selectedStudent = useMemo(
    () => students.find((s) => s.student_id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  )

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', fontFamily: 'var(--ui)' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 28px',
        background: 'rgba(244,240,230,0.95)', backdropFilter: 'blur(6px)',
        borderBottom: '1px solid var(--ink)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic' }}>Inertia.edu</span>
          </Link>
          <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            / Instructor dashboard
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-muted)' }}>
            {clock}
          </span>
          <LiveIndicator connected={stream.connected} />
          <button
            type="button"
            onClick={() => { void refreshStatus() }}
            style={{
              border: '1px solid var(--ink)', background: 'var(--paper)',
              padding: '5px 12px', fontFamily: 'var(--ui)', fontSize: 10,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'background .1s, transform .1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--caution)'; (e.currentTarget as HTMLElement).style.transform = 'translate(-1px,-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '2px 2px 0 var(--ink)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--paper)'; (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: '28px 28px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Page heading */}
        <div style={{ marginBottom: 28, borderBottom: '1px solid var(--ink)', paddingBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 38, fontStyle: 'italic', margin: 0, lineHeight: 1.1 }}>
            Checkpoint <span style={{ fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontStyle: 'normal', color: 'var(--ink-muted)', verticalAlign: 'middle' }}>/ live</span>
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--ink-muted)' }}>
            Last refresh: {lastRefresh}
          </p>
        </div>

        {error && (
          <div style={{
            border: '1px solid var(--signal)', background: 'rgba(215,64,44,0.08)',
            padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--signal)',
          }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ color: 'var(--ink-muted)', fontStyle: 'italic', padding: '40px 0', textAlign: 'center' }}>
            Loading dashboard…
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ marginBottom: 24 }}>
              <StatCards students={students} />
            </div>

            {/* Student table */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--ui)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>
                Students — click row for detail
              </div>
              <StudentTable
                students={students}
                onSelect={(student) => setSelectedStudentId(student.student_id)}
              />
            </div>

            {/* Heatmap + Authenticity side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={{ border: '1px solid var(--ink)', padding: '16px', boxShadow: '3px 3px 0 var(--ink)' }}>
                <StruggleHeatmap data={heatmap} />
              </div>
              <div style={{ border: '1px solid var(--ink)', padding: '16px', boxShadow: '3px 3px 0 var(--ink)' }}>
                <AuthenticityPanel records={authenticityRecords} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Student drawer */}
      {selectedStudent && (
        <StudentDrawer
          student={selectedStudent}
          onClose={() => setSelectedStudentId(null)}
          onLockoutCleared={() => { void refreshStatus() }}
        />
      )}
    </div>
  )
}
